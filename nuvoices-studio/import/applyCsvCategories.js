const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const ContentTransformer = require('./transformers');

if (!process.env.SANITY_STUDIO_PROJECT_ID || !process.env.SANITY_STUDIO_DATASET) {
  throw new Error('Missing Sanity Studio project ID or dataset environment variables');
}

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2023-05-03'
});

function parseCsv(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n').slice(1); // skip header
  return lines.map(line => {
    const firstComma = line.indexOf(',');
    const lastComma = line.lastIndexOf(',');
    return {
      wpPostId: parseInt(line.substring(0, firstComma)),
      title: line.substring(firstComma + 1, lastComma).trim(),
      category: line.substring(lastComma + 1).trim(),
    };
  });
}

async function applyCsvCategories(csvPath = './featured-stories-categorization.csv') {
  console.log(`Reading CSV from: ${csvPath}`);
  const rows = parseCsv(csvPath);
  console.log(`Found ${rows.length} rows to process`);

  // Fetch all categories from Sanity
  const categories = await client.fetch('*[_type == "category" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current }');
  const categoryMap = new Map(categories.map(c => [c.slug, c._id]));

  let updatedCount = 0;
  let skippedCount = 0;

  for (const { wpPostId, title, category } of rows) {
    const categoryId = categoryMap.get(category);
    if (!categoryId) {
      console.warn(`  Category "${category}" not found in Sanity — skipping post ${wpPostId}`);
      skippedCount++;
      continue;
    }

    const post = await client.fetch(
      '*[_type == "post" && wpPostId == $wpPostId][0]{ _id, categories }',
      { wpPostId }
    );

    if (!post) {
      console.warn(`  Post wpPostId=${wpPostId} not found in Sanity — skipping`);
      skippedCount++;
      continue;
    }

    // Skip if the category is already on the post
    const existingRefs = (post.categories || []).map(c => c._ref);
    if (existingRefs.includes(categoryId)) {
      console.log(`  Already has "${category}": ${title}`);
      skippedCount++;
      continue;
    }

    const newRef = {
      _key: ContentTransformer.generateKey(),
      _type: 'reference',
      _ref: categoryId,
    };

    const publishedId = post._id.replace(/^drafts\./, '');
    await client.patch(publishedId).append('categories', [newRef]).commit();

    console.log(`  Added "${category}" to: ${title}`);
    updatedCount++;
  }

  console.log(`\nDone: ${updatedCount} updated, ${skippedCount} skipped`);
  return { updatedCount, skippedCount };
}

if (require.main === module) {
  const csvPath = process.argv[2] || path.resolve(__dirname, './featured-stories-categorization.csv');
  applyCsvCategories(csvPath)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to apply CSV categories:', error);
      process.exit(1);
    });
}

module.exports = applyCsvCategories;
