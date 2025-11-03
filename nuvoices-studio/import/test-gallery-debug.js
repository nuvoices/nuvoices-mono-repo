const WordPressParser = require('./parser');

async function test() {
  const parser = new WordPressParser('./nuvoices.xml');
  await parser.parseXML();
  
  const wpPosts = parser.getPosts();
  const wpAttachments = parser.getAttachments();
  
  const post = wpPosts.find(p => p.wpPostId === 1195);
  
  console.log('Post found:', post.title);
  console.log('\nGallery shortcodes in content:');
  const galleryMatches = post.content.match(/\[gallery[^\]]+\]/g);
  console.log(galleryMatches);
  
  console.log('\nAttachments available:', wpAttachments.length);
  
  // Check if gallery IDs exist in attachments
  const galleryIds = [1215, 1302, 1298, 1311, 1216, 1221, 1305];
  console.log('\nChecking gallery image IDs:');
  galleryIds.forEach(id => {
    const att = wpAttachments.find(a => a.wpPostId === id);
    if (att) {
      console.log(`  ✅ ID ${id}: ${att.url}`);
    } else {
      console.log(`  ❌ ID ${id}: NOT FOUND`);
    }
  });
}

test().catch(console.error);
