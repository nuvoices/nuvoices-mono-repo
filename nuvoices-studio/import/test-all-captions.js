#!/usr/bin/env node

const ContentTransformer = require('./transformers');
const WordPressParser = require('./parser');

async function testAllPosts() {
  console.log('🔍 Testing Caption Shortcode Fix Against ALL Posts\n');
  console.log('='.repeat(70));

  // Parse the WordPress XML
  const parser = new WordPressParser('./nuvoices.xml');
  await parser.parseXML();
  const posts = parser.getPosts();

  console.log(`\n📊 Total posts to analyze: ${posts.length}\n`);

  // Track statistics
  let postsWithCaptions = 0;
  let postsWithCaptionShortcodes = 0;
  let successfullyFixed = 0;
  let failedToFix = 0;
  const affectedPosts = [];
  const failedPosts = [];

  for (const post of posts) {
    if (!post.content) continue;

    // Check if post has caption shortcodes
    const hasCaptionShortcode = /\[caption[^\]]*\]/i.test(post.content);

    if (hasCaptionShortcode) {
      postsWithCaptionShortcodes++;
      affectedPosts.push({
        title: post.title,
        slug: post.slug,
        wpPostId: post.wpPostId
      });

      // Test the preprocessing
      try {
        const preprocessed = ContentTransformer.preprocessCaptions(post.content);

        // Check if shortcodes were removed
        const stillHasShortcode = /\[caption[^\]]*\]/i.test(preprocessed);

        if (stillHasShortcode) {
          failedToFix++;
          failedPosts.push({
            title: post.title,
            slug: post.slug,
            reason: 'Shortcode still present after preprocessing'
          });
        } else {
          // Check if figure was created
          const hasFigure = /<figure[^>]*data-wp-caption[^>]*>/.test(preprocessed);

          if (hasFigure) {
            successfullyFixed++;
          } else {
            failedToFix++;
            failedPosts.push({
              title: post.title,
              slug: post.slug,
              reason: 'No figure element created'
            });
          }
        }
      } catch (error) {
        failedToFix++;
        failedPosts.push({
          title: post.title,
          slug: post.slug,
          reason: `Error: ${error.message}`
        });
      }
    }

    // Also check for any existing <figure> or <figcaption> elements
    const hasFigure = /<figure/i.test(post.content);
    const hasFigcaption = /<figcaption/i.test(post.content);

    if (hasFigure || hasFigcaption) {
      postsWithCaptions++;
    }
  }

  console.log('='.repeat(70));
  console.log('\n📈 ANALYSIS RESULTS\n');
  console.log('─'.repeat(70));

  console.log(`\n📝 Caption Statistics:`);
  console.log(`   Posts with [caption] shortcodes: ${postsWithCaptionShortcodes}`);
  console.log(`   Posts with <figure>/<figcaption>: ${postsWithCaptions}`);
  console.log(`   Total affected posts: ${postsWithCaptionShortcodes}`);

  console.log(`\n✅ Fix Results:`);
  console.log(`   Successfully preprocessed: ${successfullyFixed}`);
  console.log(`   Failed to preprocess: ${failedToFix}`);
  console.log(`   Success rate: ${postsWithCaptionShortcodes > 0 ? ((successfullyFixed / postsWithCaptionShortcodes) * 100).toFixed(1) : 0}%`);

  if (affectedPosts.length > 0) {
    console.log(`\n📋 Posts with Caption Shortcodes (${affectedPosts.length}):`);
    console.log('─'.repeat(70));

    affectedPosts.slice(0, 20).forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title}`);
      console.log(`      Slug: ${post.slug}`);
    });

    if (affectedPosts.length > 20) {
      console.log(`   ... and ${affectedPosts.length - 20} more`);
    }
  }

  if (failedPosts.length > 0) {
    console.log(`\n❌ Failed Posts (${failedPosts.length}):`);
    console.log('─'.repeat(70));

    failedPosts.forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title}`);
      console.log(`      Slug: ${post.slug}`);
      console.log(`      Reason: ${post.reason}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  if (failedToFix === 0 && postsWithCaptionShortcodes > 0) {
    console.log('\n🎉 SUCCESS! All posts with caption shortcodes can be fixed.\n');
    return { success: true, affectedCount: postsWithCaptionShortcodes };
  } else if (postsWithCaptionShortcodes === 0) {
    console.log('\n✅ No posts with caption shortcodes found.\n');
    return { success: true, affectedCount: 0 };
  } else {
    console.log('\n⚠️  Some posts failed preprocessing. Review failed posts above.\n');
    return { success: false, affectedCount: postsWithCaptionShortcodes, failedCount: failedToFix };
  }
}

// Run the test
testAllPosts()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
