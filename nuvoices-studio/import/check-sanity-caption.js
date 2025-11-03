const { createClient } = require('@sanity/client');
const dotenv = require('dotenv');
dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2023-05-03'
});

async function checkPost() {
  const post = await client.fetch(
    '*[_type == "post" && wpPostId == 1209][0]{ title, body }'
  );

  console.log('Post:', post.title);
  console.log('\nBody blocks:');

  post.body.forEach((block, i) => {
    console.log(`\nBlock ${i + 1} (${block._type}):`);

    if (block._type === 'image') {
      console.log('  Caption:', block.caption);
      console.log('  Asset:', block.asset._ref);
    } else if (block._type === 'block') {
      const text = block.children.map(c => c.text).join('');
      console.log('  Text:', text.substring(0, 100));
    } else {
      console.log('  ', JSON.stringify(block, null, 2));
    }
  });
}

checkPost().catch(console.error);
