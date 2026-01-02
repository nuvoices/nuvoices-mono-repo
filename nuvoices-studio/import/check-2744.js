const WordPressParser = require('./parser');

async function test() {
  const parser = new WordPressParser('./nuvoices.xml');
  await parser.parseXML();
  
  const wpPosts = parser.getPosts();
  const post = wpPosts.find(p => p.wpPostId === 2744);
  
  console.log('Post found:', post.title);
  console.log('Contains [gallery:', post.content.includes('[gallery'));
  
  if (post.content.includes('[gallery')) {
    const match = post.content.match(/\[gallery[^\]]+\]/);
    console.log('\nFirst gallery shortcode found:', match ? match[0] : 'none');
  }
}

test().catch(console.error);
