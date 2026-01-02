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

async function checkAssets() {
  const assetIds = [
    'image-c261338b12f03e960d5862ad804ae1b63c2915f1-600x338-jpg',
    'image-44de18a96fd4b3903395d7197632813696bae217-600x338-jpg',
    'image-8a6e9cbbfa2db8f4f8673f6f773a7e0713310587-600x338-jpg'
  ];

  for (const id of assetIds) {
    const asset = await client.fetch('*[_id == $id][0]{ _id, url }', { id });
    if (asset) {
      console.log(`✅ ${id.substring(0, 50)}...`);
      console.log(`   URL: ${asset.url}`);
    } else {
      console.log(`❌ MISSING: ${id}`);
    }
  }
}

checkAssets().catch(console.error);
