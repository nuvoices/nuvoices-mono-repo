const WordPressParser = require('./parser.js');
const ContentTransformer = require('./transformers.js');

const parser = new WordPressParser('./nuvoices.xml');

parser.parseXML().then(() => {
  const posts = parser.getPosts();
  const testPost = posts.find(p => p.slug === 'female-artists-and-writers-reflect-on-feminist-art-and-journalism');

  if (testPost) {
    console.log('='.repeat(80));
    console.log('TESTING FIXED CONTENT');
    console.log('='.repeat(80));
    console.log('Post:', testPost.title);
    console.log();
    console.log('First 500 chars of HTML content:');
    console.log('-'.repeat(80));
    console.log(testPost.content.substring(0, 500));
    console.log();
    console.log('='.repeat(80));
    console.log('PORTABLE TEXT TRANSFORMATION:');
    console.log('='.repeat(80));

    const portableText = ContentTransformer.htmlToPortableText(testPost.content);

    // Show first 3 blocks
    console.log('First 3 blocks:');
    portableText.slice(0, 3).forEach((block, i) => {
      console.log();
      console.log(`Block ${i + 1}:`);
      console.log(JSON.stringify(block, null, 2));
    });

    console.log();
    console.log('='.repeat(80));
    console.log('VERIFICATION:');
    console.log('='.repeat(80));
    console.log(`Total blocks: ${portableText.length}`);

    // Check the specific content that was problematic
    const problematicBlock = portableText.find(block =>
      block._type === 'block' &&
      block.children &&
      block.children.some(child => child.text && child.text.includes('Li Xinmo'))
    );

    if (problematicBlock) {
      console.log();
      console.log('✅ SUCCESS: Found inline content properly grouped:');
      console.log('Block with "Li Xinmo":');
      const fullText = problematicBlock.children.map(c => c.text || '').join('');
      console.log(`  "${fullText.substring(0, 150)}..."`);
      console.log(`  Number of children in block: ${problematicBlock.children.length}`);
    } else {
      console.log('❌ ISSUE: Could not find expected content');
    }
  }
}).catch(err => console.error('Error:', err));
