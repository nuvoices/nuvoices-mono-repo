const ContentTransformer = require('./transformers');

// Test cases for empty paragraph removal
const testCases = [
  {
    name: 'Empty paragraph',
    input: '<p>Some text</p><p></p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with only spaces',
    input: '<p>Some text</p><p>   </p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with &nbsp;',
    input: '<p>Some text</p><p>&nbsp;</p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with multiple &nbsp;',
    input: '<p>Some text</p><p>&nbsp;&nbsp;&nbsp;</p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with <br>',
    input: '<p>Some text</p><p><br></p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with <br/>',
    input: '<p>Some text</p><p><br/></p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with <br />',
    input: '<p>Some text</p><p><br /></p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with mixed whitespace, &nbsp; and <br>',
    input: '<p>Some text</p><p>  &nbsp; <br /> &nbsp;  </p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Paragraph with newlines',
    input: '<p>Some text</p><p>\n\n</p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Multiple consecutive empty paragraphs',
    input: '<p>Some text</p><p></p><p> </p><p>&nbsp;</p><p><br/></p><p>More text</p>',
    expected: '<p>Some text</p><p>More text</p>'
  },
  {
    name: 'Preserve paragraph with actual content',
    input: '<p>Some text</p><p>Actual content</p><p></p><p>More text</p>',
    expected: '<p>Some text</p><p>Actual content</p><p>More text</p>'
  },
  {
    name: 'Preserve paragraph with content and &nbsp;',
    input: '<p>Some text</p><p>Content &nbsp; with spaces</p><p></p><p>More text</p>',
    expected: '<p>Some text</p><p>Content &nbsp; with spaces</p><p>More text</p>'
  }
];

console.log('Testing empty paragraph removal...\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = ContentTransformer.preprocessEmptyParagraphs(test.input);
  const success = result === test.expected;

  if (success) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${test.name}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${test.name}`);
    console.log(`  Input:    ${test.input}`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got:      ${result}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed > 0) {
  process.exit(1);
}
