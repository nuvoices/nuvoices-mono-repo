const ContentTransformer = require('./transformers');

console.log('Testing horizontal rule transformations...\n');

// Test case 1: <p>---</p>
const test1 = '<p>Some text before</p><p>---</p><p>Some text after</p>';
console.log('Test 1: <p>---</p>');
console.log('Input:', test1);
const result1 = ContentTransformer.htmlToPortableText(test1);
console.log('Output:', JSON.stringify(result1, null, 2));
console.log('✓ Should have a horizontalRule block\n');

// Test case 2: <p>--- </p> (with spaces)
const test2 = '<p>Paragraph one</p><p>  ---  </p><p>Paragraph two</p>';
console.log('Test 2: <p>  ---  </p> (with spaces)');
console.log('Input:', test2);
const result2 = ContentTransformer.htmlToPortableText(test2);
console.log('Output:', JSON.stringify(result2, null, 2));
console.log('✓ Should have a horizontalRule block\n');

// Test case 3: Mixed content from actual WordPress post
const test3 = `
<p>Author bio paragraph</p>
<p>---</p>
<p>About the author</p>
`;
console.log('Test 3: Real-world example');
console.log('Input:', test3);
const result3 = ContentTransformer.htmlToPortableText(test3);
console.log('Output:', JSON.stringify(result3, null, 2));
console.log('✓ Should have a horizontalRule block between paragraphs\n');

// Verify results
const hasHrType1 = result1.some(block => block._type === 'horizontalRule');
const hasHrType2 = result2.some(block => block._type === 'horizontalRule');
const hasHrType3 = result3.some(block => block._type === 'horizontalRule');

console.log('\n=== Test Results ===');
console.log(`Test 1: ${hasHrType1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Test 2: ${hasHrType2 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Test 3: ${hasHrType3 ? '✅ PASS' : '❌ FAIL'}`);

if (hasHrType1 && hasHrType2 && hasHrType3) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}
