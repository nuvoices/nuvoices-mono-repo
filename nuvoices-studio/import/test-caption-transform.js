const ContentTransformer = require('./transformers');

// Test with the actual caption format from post 1209
const testHtml = `<p>Some text before.</p><p>[caption id="attachment_1223" align="aligncenter" width="600"]</p><img class="size-medium wp-image-1223" src="http://example.com/image.jpg" alt="" width="600" height="400"><p> Writer Lijia Zhang. Photo Credit: Antonio Wan[/caption]</p><p>Some text after.</p>`;

console.log('ORIGINAL HTML:');
console.log(testHtml);
console.log('\n\n' + '='.repeat(80) + '\n');

const processed = ContentTransformer.preprocessCaptions(testHtml);

console.log('AFTER preprocessCaptions:');
console.log(processed);
console.log('\n\n' + '='.repeat(80) + '\n');

// Now convert to Portable Text to see what blocks are created
const portableText = ContentTransformer.htmlToPortableText(testHtml, new Map());

console.log('PORTABLE TEXT BLOCKS:');
console.log(JSON.stringify(portableText, null, 2));
