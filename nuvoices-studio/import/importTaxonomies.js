const { createClient } = require('@sanity/client');
const WordPressParser = require('./parser');
const ContentTransformer = require('./transformers');

// Map old WordPress categories to new simplified categories
const CATEGORY_MAPPING = {
  // Podcast
  'podcast': 'podcast',

  // Magazine
  'featured-stories': 'magazine',
  'opinion': 'magazine',
  'personal-essay': 'magazine',
  'photography': 'magazine',
  'profiles': 'magazine',
  'qa': 'magazine',
  'translation': 'magazine',
  'travel': 'magazine',
  'art': 'magazine',
  'essay': 'magazine',
  'fiction': 'magazine',
  'film': 'magazine',
  'books': 'magazine',

  // News
  'events': 'news',
  'job': 'news',
  'uncategorized': 'news',
};

// The 3 new fixed categories
const NEW_CATEGORIES = [
  { id: 'podcast', title: 'Podcast', slug: 'podcast' },
  { id: 'magazine', title: 'Magazine', slug: 'magazine' },
  { id: 'news', title: 'News', slug: 'news' },
];

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

async function importCategories() {
  try {
    console.log('Starting category import (3 fixed categories)...');

    const categoryMap = new Map(); // Maps category slug to Sanity _id

    for (const category of NEW_CATEGORIES) {
      // Check if category already exists
      const existingCategory = await client.fetch(
        '*[_type == "category" && slug.current == $slug][0]',
        { slug: category.slug }
      );

      if (existingCategory) {
        console.log(`Category "${category.title}" already exists, skipping...`);
        categoryMap.set(category.slug, existingCategory._id);
        continue;
      }

      const categoryDoc = {
        _type: 'category',
        _id: `category-${category.id}`,
        title: category.title,
        slug: {
          _type: 'slug',
          current: category.slug
        },
      };

      const result = await client.createOrReplace(categoryDoc);
      categoryMap.set(category.slug, result._id);
      console.log(`Imported category: ${categoryDoc.title}`);
    }

    console.log(`Successfully imported ${NEW_CATEGORIES.length} categories`);
    return categoryMap;
  } catch (error) {
    console.error('Error importing categories:', error);
    throw error;
  }
}

async function importTags() {
  try {
    console.log('Starting tag import...');
    
    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();
    
    const wpTags = parser.getTags();
    console.log(`Found ${wpTags.length} tags to import`);

    const transaction = client.transaction();
    const tagMap = new Map(); // Maps wp nicename to Sanity _id

    for (const wpTag of wpTags) {
      console.log('wpTag', wpTag);
      // Check if tag already exists
      const existingTag = await client.fetch(
        '*[_type == "tag" && wpNicename == $wpNicename][0]',
        { wpNicename: wpTag.nicename }
      );

      if (existingTag) {
        console.log(`Tag "${wpTag.name}" already exists, skipping...`);
        tagMap.set(wpTag.nicename, existingTag._id);
        continue;
      }

      const tagDoc = {
        _type: 'tag',
        _id: `tag-wp-${ContentTransformer.createSlug(wpTag.nicename)}`,
        title: wpTag.name,
        slug: {
          _type: 'slug',
          current: ContentTransformer.createSlug(wpTag.nicename)
        },
        description: wpTag.description,
        wpNicename: wpTag.nicename,
      };

      transaction.createOrReplace(tagDoc);
      tagMap.set(wpTag.nicename, tagDoc._id);
      console.log(`Queued tag: ${tagDoc.title}`);
    }

    // Commit the transaction
    const result = await transaction.commit();
    console.log(`Successfully imported ${result.results.length} tags`);
    
    return tagMap;
  } catch (error) {
    console.error('Error importing tags:', error);
    throw error;
  }
}

async function importTaxonomies() {
  try {
    console.log('Starting taxonomy import (categories and tags)...');
    
    const categoryMap = await importCategories();
    const tagMap = await importTags();
    
    console.log('Taxonomy import completed successfully');
    return { categoryMap, tagMap };
  } catch (error) {
    console.error('Taxonomy import failed:', error);
    throw error;
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importTaxonomies()
    .then(() => {
      console.log('Taxonomy import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Taxonomy import failed:', error);
      process.exit(1);
    });
}

module.exports = { importTaxonomies, importCategories, importTags, CATEGORY_MAPPING };