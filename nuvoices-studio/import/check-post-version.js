const { createClient } = require('@sanity/client');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2023-05-03'
});

async function checkPostVersion(wpPostId) {
  const publishedId = `post-wp-${wpPostId}`;
  const draftId = `drafts.post-wp-${wpPostId}`;

  const published = await client.fetch('*[_id == $id][0]{ _id, _updatedAt, title }', { id: publishedId });
  const draft = await client.fetch('*[_id == $id][0]{ _id, _updatedAt, title }', { id: draftId });

  console.log('\n=== Document Version Check ===\n');
  console.log(`WordPress Post ID: ${wpPostId}\n`);

  if (published) {
    console.log('✅ PUBLISHED version exists:');
    console.log(`   ID: ${published._id}`);
    console.log(`   Title: ${published.title}`);
    console.log(`   Last updated: ${published._updatedAt}\n`);
  } else {
    console.log('❌ No PUBLISHED version found\n');
  }

  if (draft) {
    console.log('📝 DRAFT version exists:');
    console.log(`   ID: ${draft._id}`);
    console.log(`   Title: ${draft.title}`);
    console.log(`   Last updated: ${draft._updatedAt}\n`);
  } else {
    console.log('✅ No DRAFT version (good - means it\'s published)\n');
  }

  if (published && !draft) {
    console.log('👍 Status: This post is PUBLISHED (no draft exists)');
  } else if (published && draft) {
    console.log('⚠️  Status: Both versions exist. Draft has unpublished changes.');
  } else if (!published && draft) {
    console.log('⚠️  Status: Only draft exists. Post is NOT published.');
  }
}

// Run the check
if (require.main === module) {
  const wpPostId = process.argv[2];

  if (!wpPostId) {
    console.error('\n❌ Error: No post ID provided');
    console.log('\nUsage:');
    console.log('  node check-post-version.js <wp-post-id>');
    console.log('\nExample:');
    console.log('  node check-post-version.js 931');
    process.exit(1);
  }

  checkPostVersion(parseInt(wpPostId))
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = checkPostVersion;
