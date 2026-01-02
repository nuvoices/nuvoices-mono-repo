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
    '*[_type == "post" && wpPostId == 1209][0]{ title, body }'
  );

  console.log('Post:', post.title);
  console.log('\nSearching for caption text duplication...\n');

  const captionTexts = [
    'Writer Lijia Zhang. Photo Credit: Antonio Wan',
    'Activist Zhang Leilei. Photo Credit: Antonio Wan',
    'Journalist Jessie Lau at the NüVoices London Launch. Photo Credit: Antonio Wan'
  ];

  captionTexts.forEach(captionText => {
    console.log(`\nSearching for: "${captionText}"`);

    // Count how many times this appears in image captions
    const imageBlocks = post.body.filter(b => b._type === 'image' && b.caption === captionText);
    console.log(`  Found in ${imageBlocks.length} image block(s)`);

    // Count how many times this appears in text blocks
    const textBlocks = post.body.filter(b => {
      if (b._type === 'block' && b.children) {
        const text = b.children.map(c => c.text).join('');
        return text.includes(captionText);
      }
      return false;
    });
    console.log(`  Found in ${textBlocks.length} text block(s)`);

    if (textBlocks.length > 0) {
      console.log('  ❌ DUPLICATION DETECTED!');
      textBlocks.forEach((block, i) => {
        const text = block.children.map(c => c.text).join('');
        console.log(`     Text block ${i + 1}: "${text}"`);
      });
    }
  });
}

checkPost().catch(console.error);
