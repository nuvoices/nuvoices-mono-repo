#!/usr/bin/env node

const ContentTransformer = require('./transformers');

// Test data from the actual WordPress XML
const testCases = [
  {
    name: 'Nancy photo caption (tender-darling post)',
    html: `<p>[caption id="attachment_458" align="alignright" width="240"]</p><img class="size-medium wp-image-458" src="http://li1584-232.members.linode.com/wp-content/uploads/2018/09/fullsizeoutput_c13-240x300.jpeg" alt="" width="240" height="300"><p> Photo of Nancy. Credit: Nancy L. Conyers.[/caption]</p>`,
    expectedCaption: 'Photo of Nancy. Credit: Nancy L. Conyers.',
    expectedWidth: 240,
    expectedAlign: 'right',
    imageSrc: 'http://li1584-232.members.linode.com/wp-content/uploads/2018/09/fullsizeoutput_c13-240x300.jpeg'
  },
  {
    name: 'Betty hiking caption (hiking-huangshan post)',
    html: `<p>[caption id="attachment_651" align="aligncenter" width="600"]</p><img class="size-medium wp-image-651" src="http://li1584-232.members.linode.com/wp-content/uploads/2018/09/Yellow-Mountain1-1-e1537114772851-600x450.jpeg" alt="" width="600" height="450"><p> Betty hiking Yellow Mountain. Credit: Betty Xiao.[/caption]</p>`,
    expectedCaption: 'Betty hiking Yellow Mountain. Credit: Betty Xiao.',
    expectedWidth: 600,
    expectedAlign: 'center',
    imageSrc: 'http://li1584-232.members.linode.com/wp-content/uploads/2018/09/Yellow-Mountain1-1-e1537114772851-600x450.jpeg'
  },
  {
    name: 'Inline caption format',
    html: `[caption id="attachment_123" align="aligncenter" width="600"]<img src="http://example.com/image.jpg" alt="Test">This is a test caption[/caption]`,
    expectedCaption: 'This is a test caption',
    expectedWidth: 600,
    expectedAlign: 'center',
    imageSrc: 'http://example.com/image.jpg'
  }
];

console.log('🧪 Testing Caption Shortcode Fix\n');
console.log('='.repeat(60));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(60));

  // Create a mock imageAssetMap with the test image
  const imageAssetMap = new Map();
  imageAssetMap.set(testCase.imageSrc, 'image-test-asset-id-123');

  try {
    // First, test the preprocessing
    console.log('\n📝 Original HTML:');
    console.log(testCase.html.substring(0, 150) + '...');

    const preprocessed = ContentTransformer.preprocessCaptions(testCase.html);
    console.log('\n🔄 After preprocessCaptions():');
    console.log(preprocessed);

    // Check if caption shortcode was removed
    if (preprocessed.includes('[caption')) {
      console.log('\n❌ FAIL: Caption shortcode still present in preprocessed HTML');
      failedTests++;
      return;
    }

    // Check if figure was created (allowing for additional data attributes)
    if (!/<figure[^>]*data-wp-caption/.test(preprocessed)) {
      console.log('\n❌ FAIL: No figure element created');
      failedTests++;
      return;
    }

    // Check if figcaption was created
    if (!preprocessed.includes('<figcaption>')) {
      console.log('\n❌ FAIL: No figcaption element created');
      failedTests++;
      return;
    }

    console.log('\n✅ Preprocessing successful');

    // Now test the full conversion to Portable Text
    const portableText = ContentTransformer.htmlToPortableText(testCase.html, imageAssetMap);

    console.log('\n📦 Portable Text Output:');
    console.log(JSON.stringify(portableText, null, 2));

    // Verify the result
    const imageBlocks = portableText.filter(block => block._type === 'image');
    const textBlocks = portableText.filter(block =>
      block._type === 'block' &&
      block.children?.[0]?.text?.includes('caption')
    );

    console.log(`\n📊 Analysis:`);
    console.log(`   Image blocks: ${imageBlocks.length}`);
    console.log(`   Text blocks with "caption": ${textBlocks.length}`);

    // Check for success criteria
    if (imageBlocks.length === 0) {
      console.log('\n❌ FAIL: No image block created');
      failedTests++;
      return;
    }

    if (imageBlocks.length > 1) {
      console.log('\n⚠️  WARNING: Multiple image blocks created (expected 1)');
    }

    if (textBlocks.length > 0) {
      console.log('\n❌ FAIL: Caption shortcode text still appears in separate blocks');
      console.log('   Offending blocks:', textBlocks.map(b => b.children[0].text));
      failedTests++;
      return;
    }

    const imageBlock = imageBlocks[0];
    if (!imageBlock.caption) {
      console.log('\n❌ FAIL: Image block has no caption');
      failedTests++;
      return;
    }

    if (imageBlock.caption !== testCase.expectedCaption) {
      console.log(`\n❌ FAIL: Caption mismatch`);
      console.log(`   Expected: "${testCase.expectedCaption}"`);
      console.log(`   Got: "${imageBlock.caption}"`);
      failedTests++;
      return;
    }

    console.log(`\n✅ PASS: Caption correctly attached to image`);
    console.log(`   Caption: "${imageBlock.caption}"`);

    // Check for width/height/alignment if present in test case
    if (testCase.expectedWidth !== undefined) {
      if (imageBlock.width === testCase.expectedWidth) {
        console.log(`   Width: ${imageBlock.width}px ✅`);
      } else {
        console.log(`   Width: Expected ${testCase.expectedWidth}, got ${imageBlock.width || 'undefined'} ❌`);
      }
    }

    if (testCase.expectedAlign !== undefined) {
      if (imageBlock.alignment === testCase.expectedAlign) {
        console.log(`   Alignment: ${imageBlock.alignment} ✅`);
      } else {
        console.log(`   Alignment: Expected ${testCase.expectedAlign}, got ${imageBlock.alignment || 'undefined'} ❌`);
      }
    }

    passedTests++;

  } catch (error) {
    console.log(`\n❌ FAIL: Error during transformation`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    failedTests++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📈 Test Summary:`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📊 Total: ${testCases.length}`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Caption shortcode fix is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the output above.\n');
  process.exit(1);
}
