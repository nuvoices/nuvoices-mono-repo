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

async function checkPost() {
  const post = await client.fetch(
    '*[_type == "post" && wpPostId == 931][0]{ title, body[_type == "image"] }'
  );
  
  console.log('Post:', post.title);
  console.log('\nImage blocks found in body:');
  console.log(JSON.stringify(post.body, null, 2));
}

checkPost().catch(console.error);
