const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '6bg89hff',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN
});

async function checkContentBlocks() {
  try {
    // Query for the specific post
    const post = await client.fetch(`
      *[_type == "post" && slug.current == "breaking-through-the-publishing-glass-ceiling-a-tribute-to-my-literary-agent"][0] {
        title,
        body
      }
    `);

    if (!post) {
      console.log('Post not found');
      return;
    }

    console.log('Post title:', post.title);
    console.log('Body blocks count:', post.body?.length || 0);
    console.log('');

    // Check for blocks with _type: 'span'
    const spanBlocks = post.body?.filter(block => block._type === 'span') || [];
    console.log('Blocks with _type "span":', spanBlocks.length);

    if (spanBlocks.length > 0) {
      console.log('\nExample span blocks:');
      spanBlocks.slice(0, 5).forEach((block, i) => {
        console.log(`\nSpan block ${i + 1}:`);
        console.log(JSON.stringify(block, null, 2));
      });
    }

    // Show the last 15 blocks
    console.log('\n=== Last 15 blocks ===');
    const lastBlocks = post.body?.slice(-15) || [];
    lastBlocks.forEach((block, i) => {
      console.log(`\nBlock ${post.body.length - 15 + i} (_type: ${block._type}):`);
      if (block._type === 'block') {
        console.log(`  style: ${block.style}`);
        console.log(`  text: ${block.children?.map(c => c.text).join('') || ''}`);
      } else if (block._type === 'span') {
        console.log(`  text: ${block.text}`);
        console.log(`  marks: ${JSON.stringify(block.marks)}`);
      } else {
        console.log(JSON.stringify(block, null, 2));
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkContentBlocks();
