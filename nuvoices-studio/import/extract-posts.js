const WordPressParser = require('./parser.js');

async function extractPosts() {
  const parser = new WordPressParser('./nuvoices.xml');
  await parser.parseXML();

  const posts = parser.getPosts();

  console.log(JSON.stringify(posts.map(post => ({
    title: post.title,
    slug: post.slug,
    publishedAt: post.publishedAt
  })), null, 2));
}

extractPosts().catch(console.error);
