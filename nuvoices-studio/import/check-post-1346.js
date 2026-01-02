const WordPressParser = require('./parser');

async function test() {
  const parser = new WordPressParser('./nuvoices.xml');
  await parser.parseXML();
  
  const wpPosts = parser.getPosts();
  const post = wpPosts.find(p => p.wpPostId === 1346);
  
  console.log('Post found:', post.title);
  console.log('\nContent length:', post.content.length);
  console.log('\nFirst 500 chars of content:');
  console.log(post.content.substring(0, 500));
  console.log('\n\nSearching for [gallery in content:');
  console.log('Contains [gallery:', post.content.includes('[gallery'));
}

test().catch(console.error);
