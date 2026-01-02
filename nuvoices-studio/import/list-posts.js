const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '6bg89hff',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN
});

async function listPosts() {
  try {
    const posts = await client.fetch(`
      *[_type == "post"] {
        _id,
        title,
        slug,
        "bodyBlockCount": count(body[])
      } | order(_createdAt desc) [0...10]
    `);

    console.log('Total posts found:', posts.length);
    console.log('');
    posts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
      console.log(`   Slug: ${post.slug?.current || 'N/A'}`);
      console.log(`   Body blocks: ${post.bodyBlockCount || 0}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

listPosts();
