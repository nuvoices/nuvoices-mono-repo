const WordPressParser = require('./parser');

async function findChineseSlugs() {
  try {
    console.log('Finding posts with URL-encoded Chinese characters in slugs...\n');

    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();

    const wpPosts = parser.getPosts();

    // Find posts with URL-encoded characters (Chinese or other non-ASCII)
    const postsWithEncodedSlugs = wpPosts.filter(post =>
      post.slug && post.slug.includes('%')
    );

    console.log(`Found ${postsWithEncodedSlugs.length} posts with URL-encoded characters in slugs:\n`);

    postsWithEncodedSlugs.forEach((post, index) => {
      // Try to decode the slug to show what the Chinese characters are
      let decodedSlug = '';
      try {
        decodedSlug = decodeURIComponent(post.slug);
      } catch (e) {
        decodedSlug = '(unable to decode)';
      }

      console.log(`${index + 1}. Post #${post.wpPostId}: "${post.title}"`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Decoded: ${decodedSlug}`);
      console.log('');
    });

    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findChineseSlugs();
