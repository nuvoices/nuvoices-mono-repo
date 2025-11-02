const ContentTransformer = require('./transformers.js');

// Test cases with problematic HTML
const testCases = [
  {
    name: 'Inline span breaking paragraph',
    html: '<p>There\'s a certain fascination that <span>Li Xinmo\'s</span> art seems to have with death.</p>'
  },
  {
    name: 'Multiple inline spans',
    html: '<p>Among them was also <span>Annabel Gueredrat of Martinique</span>, whose own performances involving dance.</p>'
  },
  {
    name: 'Nested formatting with span',
    html: '<p>Lisa, you are so nice but <span>mei guanxi de</span>, it\'s ok, I have my friend\'s car.</p>'
  },
  {
    name: 'Span with emphasis',
    html: '<p>The <span><em>italicized</em> text</span> should be inline.</p>'
  },
  {
    name: 'Normal paragraph without span (control)',
    html: '<p>This is a normal paragraph without any spans.</p>'
  }
];

console.log('='.repeat(80));
console.log('TRANSFORMER TEST SUITE');
console.log('='.repeat(80));
console.log();

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(80));
  console.log('Input HTML:');
  console.log(testCase.html);
  console.log();

  const result = ContentTransformer.htmlToPortableText(testCase.html);

  console.log('Output Portable Text:');
  console.log(JSON.stringify(result, null, 2));
  console.log();

  // Analysis
  const blockCount = result.length;
  const hasSpanBlocks = result.some(block => block._type === 'span');

  console.log('Analysis:');
  console.log(`  - Number of blocks: ${blockCount}`);
  console.log(`  - Expected blocks: 1`);
  console.log(`  - Has malformed span blocks: ${hasSpanBlocks ? 'YES ⚠️' : 'NO ✓'}`);

  if (blockCount === 1 && !hasSpanBlocks) {
    console.log('  ✅ PASS - Content is properly inline within single block');
  } else if (blockCount > 1) {
    console.log('  ❌ FAIL - Content split into multiple blocks (should be 1)');
  } else if (hasSpanBlocks) {
    console.log('  ❌ FAIL - Contains span type blocks (should only be in children)');
  }

  console.log();
  console.log('='.repeat(80));
  console.log();
});

// Summary
console.log('EXPECTED RESULTS AFTER FIX:');
console.log('- All tests should show "Number of blocks: 1"');
console.log('- All tests should show "Has malformed span blocks: NO ✓"');
console.log('- All span content should appear in the children array of a single block');
console.log();
