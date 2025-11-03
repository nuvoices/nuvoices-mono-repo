const WordPressParser = require('./parser');

async function test() {
  const parser = new WordPressParser('./nuvoices.xml');
  await parser.parseXML();

  const wpPosts = parser.getPosts();
  const post = wpPosts.find(p => p.wpPostId === 1209);

  console.log('Post found:', post.title);
  console.log('\nSearching for captions in content...\n');

  // Find all caption instances
  const captionPattern = /\[caption[^\]]*\][^[]*\[\/caption\]/gi;
  const captions = post.content.match(captionPattern);

  if (captions) {
    console.log(`Found ${captions.length} caption shortcodes:\n`);
    captions.forEach((cap, i) => {
      console.log(`Caption ${i + 1}:`);
      console.log(cap);
      console.log('\n---\n');
    });
  } else {
    console.log('No caption shortcodes found');
  }
}

test().catch(console.error);
