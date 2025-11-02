const { createClient } = require('@sanity/client');
const dotenv = require('dotenv');
dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function findBadPosts() {
  console.log(`Checking all posts in ${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}...\n`);

  // Get all posts
  const posts = await client.fetch(
    `*[_type == "post"] { _id, title, "slug": slug.current, body }`
  );

  console.log(`Total posts: ${posts.length}\n`);

  const badPosts = [];

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return;

    // Check for top-level spans
    const topLevelSpans = post.body.filter(block => block._type === 'span');

    if (topLevelSpans.length > 0) {
      badPosts.push({
        title: post.title,
        slug: post.slug,
        spanCount: topLevelSpans.length,
        totalBlocks: post.body.length
      });
    }
  });

  console.log('='.repeat(80));
  console.log('RESULTS:');
  console.log('='.repeat(80));

  if (badPosts.length === 0) {
    console.log('✅ NO PROBLEMS FOUND!');
    console.log('All posts have properly structured Portable Text.');
    console.log('\nThe [@portabletext/react] errors might be from:');
    console.log('  1. Cached data in Next.js');
    console.log('  2. Browser cache');
    console.log('\nTry: Restart the dev server or hard refresh the browser');
  } else {
    console.log(`❌ FOUND ${badPosts.length} POSTS WITH TOP-LEVEL SPANS:\n`);

    badPosts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Top-level spans: ${post.spanCount}`);
      console.log(`   Total blocks: ${post.totalBlocks}`);
      console.log();
    });

    console.log('\nThese posts need to be re-imported with the fixed XML.');
  }
}

findBadPosts().catch(console.error);
