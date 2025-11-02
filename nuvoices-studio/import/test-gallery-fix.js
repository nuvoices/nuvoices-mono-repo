const WordPressParser = require('./parser');
const ContentTransformer = require('./transformers');

async function testGalleryPreprocessing() {
  try {
    console.log('Testing gallery shortcode preprocessing...\n');

    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();

    const wpPosts = parser.getPosts();
    const wpAttachments = parser.getAttachments();

    // Create attachment lookup map
    const attachmentMap = new Map();
    wpAttachments.forEach(att => {
      attachmentMap.set(att.wpPostId, att);
    });

    console.log(`Total attachments: ${wpAttachments.length}`);
    console.log(`Attachment map size: ${attachmentMap.size}\n`);

    // Find posts with gallery shortcodes
    const postsWithGalleries = wpPosts.filter(post =>
      post.content && post.content.includes('[gallery')
    );

    console.log(`Found ${postsWithGalleries.length} posts with gallery shortcodes:\n`);

    postsWithGalleries.forEach((post, index) => {
      console.log(`${index + 1}. Post #${post.wpPostId}: "${post.title}"`);
      console.log(`   Slug: ${post.slug}`);

      // Extract gallery shortcodes
      const galleryMatches = post.content.match(/\[gallery[^\]]+\]/g);
      if (galleryMatches) {
        galleryMatches.forEach((gallery, gIndex) => {
          console.log(`   Gallery ${gIndex + 1}: ${gallery}`);

          // Extract IDs
          const idsMatch = gallery.match(/ids=["']([^"']+)["']/i);
          if (idsMatch) {
            const ids = idsMatch[1].split(',').map(id => parseInt(id.trim(), 10));
            console.log(`   Image IDs: ${ids.join(', ')}`);

            // Check if attachments exist
            const missingIds = ids.filter(id => !attachmentMap.has(id));
            if (missingIds.length > 0) {
              console.log(`   ⚠️  Missing attachments: ${missingIds.join(', ')}`);
            } else {
              console.log(`   ✓ All attachments found`);
            }
          }
        });
      }

      console.log('');

      // Test preprocessing
      console.log('   Testing preprocessing:');
      const preprocessedHtml = ContentTransformer.preprocessGalleries(post.content, attachmentMap);

      // Check if galleries were replaced
      const remainingGalleries = (preprocessedHtml.match(/\[gallery/g) || []).length;
      const figuresAdded = (preprocessedHtml.match(/<figure class="wp-gallery-image">/g) || []).length;

      console.log(`   Remaining gallery shortcodes: ${remainingGalleries}`);
      console.log(`   Figures added: ${figuresAdded}`);

      if (remainingGalleries === 0 && figuresAdded > 0) {
        console.log(`   ✓ Preprocessing successful!\n`);
      } else {
        console.log(`   ✗ Preprocessing may have issues\n`);
      }

      // Show a snippet of the preprocessed HTML
      const firstFigure = preprocessedHtml.match(/<figure class="wp-gallery-image">.*?<\/figure>/s);
      if (firstFigure) {
        console.log(`   First figure element (preview):`);
        console.log(`   ${firstFigure[0].substring(0, 200)}...\n`);
      }
    });

    console.log('Test complete!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testGalleryPreprocessing();
