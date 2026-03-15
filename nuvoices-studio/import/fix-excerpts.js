/**
 * Post-import fixes for the 22 newly imported posts:
 *   1. Clear excerpts (WP auto-excerpts duplicate the body opening)
 *   2. Fix title whitespace (double spaces, trailing spaces)
 *   3. Remove duplicate leading body image from wp:4397
 *   4. Add "featured" category to wp:4400
 *
 * Usage:
 *   node fix-excerpts.js            # dry run
 *   node fix-excerpts.js --commit   # write to Sanity (staging2)
 *   node fix-excerpts.js --commit --production
 */

const { createClient } = require('@sanity/client');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
if (args.includes('--production')) {
  process.env.SANITY_STUDIO_DATASET = 'production';
  console.log('Warning: Using PRODUCTION dataset\n');
} else if (!process.env.SANITY_STUDIO_DATASET) {
  process.env.SANITY_STUDIO_DATASET = 'staging2';
}

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2023-05-03',
});

const POST_IDS = [
  4419, 4415, 4411, 4400, 4397, 4388, 4386, 4353,
  4376, 4366, 4362, 4310, 4338, 4340, 4334, 4330,
  4320, 4312, 4305, 4300, 4297, 4291,
];

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '\u2026');
}

function fixTitle(title) {
  if (!title) return title;
  return title.replace(/  +/g, ' ').trim();
}

async function fixExcerpts() {
  const commit = args.includes('--commit');

  console.log(`\n=== Fix Excerpts & Titles ===`);
  console.log(`Dataset: ${process.env.SANITY_STUDIO_DATASET}`);
  console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN'}\n`);

  const posts = await client.fetch(
    `*[_type == "post" && wpPostId in $ids] { _id, wpPostId, title, excerpt }`,
    { ids: POST_IDS }
  );

  console.log(`Found ${posts.length} posts\n`);

  let fixedCount = 0;

  for (const post of posts) {
    const patches = {};

    // Clear excerpt — WP auto-excerpts just repeat the body opening
    if (post.excerpt) {
      patches.excerpt = '';
    }

    // Fix title whitespace
    const fixedTitle = fixTitle(post.title);
    if (fixedTitle !== post.title) {
      patches.title = fixedTitle;
      // Also update SEO metaTitle if it was based on the old title
      patches['seo.metaTitle'] = fixedTitle.length <= 60
        ? fixedTitle
        : fixedTitle.substring(0, 57) + '...';
    }

    if (Object.keys(patches).length === 0) {
      console.log(`  wp:${post.wpPostId} - no changes needed`);
      continue;
    }

    if (commit) {
      await client.patch(post._id).set(patches).commit();
      console.log(`  FIXED wp:${post.wpPostId}:`);
    } else {
      console.log(`  [DRY RUN] wp:${post.wpPostId}:`);
    }

    if ('excerpt' in patches) {
      console.log(`    excerpt: cleared`);
    }
    if (patches.title) {
      console.log(`    title: "${post.title}" -> "${patches.title}"`);
    }

    fixedCount++;
  }

  console.log(`\n${commit ? 'Fixed' : 'Would fix'}: ${fixedCount} / ${posts.length} posts`);

  // --- Fix 3: Remove duplicate leading body image from wp:4397 ---
  console.log(`\n=== Duplicate Body Image (wp:4397) ===`);
  const gishJen = await client.fetch(
    `*[_type == "post" && wpPostId == 4397][0] { _id, body[0] { _key, _type } }`
  );
  if (gishJen && gishJen.body && gishJen.body._type === 'image') {
    const key = gishJen.body._key;
    if (commit) {
      await client.patch(gishJen._id).unset([`body[_key=="${key}"]`]).commit();
      console.log(`  Removed duplicate image (key: ${key})`);
    } else {
      console.log(`  [DRY RUN] Would remove duplicate image (key: ${key})`);
    }
  } else {
    console.log(`  No duplicate image found (already clean)`);
  }

  // --- Fix 4: Add "featured" category to wp:4400 ---
  console.log(`\n=== Featured Category (wp:4400) ===`);
  const tongren = await client.fetch(
    `*[_type == "post" && wpPostId == 4400][0] { _id, "hasFeatured": "category-featured" in categories[]._ref }`
  );
  if (tongren && !tongren.hasFeatured) {
    if (commit) {
      await client
        .patch(tongren._id)
        .setIfMissing({ categories: [] })
        .append('categories', [{ _type: 'reference', _ref: 'category-featured', _key: 'featuredCatRef' }])
        .commit();
      console.log(`  Added "featured" category`);
    } else {
      console.log(`  [DRY RUN] Would add "featured" category`);
    }
  } else {
    console.log(`  Already has "featured" category (already clean)`);
  }

  console.log(`\n=== All fixes complete ===`);
}

fixExcerpts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
