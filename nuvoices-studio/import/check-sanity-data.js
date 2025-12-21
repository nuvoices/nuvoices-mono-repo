const { createClient } = require('@sanity/client');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

console.log(`Connecting to Sanity project: ${process.env.SANITY_STUDIO_PROJECT_ID}`);
console.log(`Dataset: ${process.env.SANITY_STUDIO_DATASET}\n`);

async function checkPost() {
  // First check if we can connect and what posts exist
  console.log('Checking connection to Sanity...\n');

  const postCount = await client.fetch(`count(*[_type == "post"])`);
  console.log(`Total posts in database: ${postCount}\n`);

  if (postCount === 0) {
    console.log('❌ No posts found in database!');
    return;
  }

  // Get a sample of post slugs
  const samplePosts = await client.fetch(
    `*[_type == "post"][0...5] { title, "slug": slug.current }`
  );
  console.log('Sample posts:');
  samplePosts.forEach(p => console.log(`  - ${p.slug}: ${p.title}`));
  console.log();

  const slug = 'female-artists-and-writers-reflect-on-feminist-art-and-journalism';

  console.log(`Fetching post: ${slug}\n`);

  const post = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      "bodyLength": length(body),
      "firstThreeBlocks": body[0...3]
    }`,
    { slug }
  );

  if (!post) {
    console.log('❌ Post not found! Trying partial match...\n');

    const partialMatch = await client.fetch(
      `*[_type == "post" && slug.current match "*feminist-art*"][0] { title, "slug": slug.current }`
    );

    if (partialMatch) {
      console.log(`Found similar post: ${partialMatch.slug}`);
    }
    return;
  }

  console.log('='.repeat(80));
  console.log('POST DATA FROM SANITY:');
  console.log('='.repeat(80));
  console.log(`Title: ${post.title}`);
  console.log(`Total blocks in body: ${post.bodyLength}`);
  console.log();
  console.log('First 3 blocks:');
  console.log(JSON.stringify(post.firstThreeBlocks, null, 2));
  console.log();

  // Check if any spans are at top level
  const fullPost = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0].body`,
    { slug }
  );

  const topLevelSpans = fullPost.filter(block => block._type === 'span');

  if (topLevelSpans.length > 0) {
    console.log('='.repeat(80));
    console.log('❌ PROBLEM FOUND:');
    console.log('='.repeat(80));
    console.log(`Found ${topLevelSpans.length} spans at the TOP LEVEL (should be nested in blocks):`);
    topLevelSpans.slice(0, 3).forEach((span, i) => {
      console.log(`\nSpan ${i + 1}:`);
      console.log(JSON.stringify(span, null, 2));
    });
  } else {
    console.log('='.repeat(80));
    console.log('✅ NO TOP-LEVEL SPANS:');
    console.log('='.repeat(80));
    console.log('All spans are properly nested within blocks.');
  }
}

checkPost().catch(console.error);
