const ContentTransformer = require('./transformers.js');

// This is the ACTUAL WordPress HTML structure (no <p> tags!)
const actualWordPressHTML = `<strong>BY DAVE YIN</strong>

There's a certain fascination that <a href="http://li-xinmo.com/">Li Xinmo's</a> art seems to have with death.

In one photo, she looks to be a murdered lifeless body floating down a polluted river.

Among them was also <a href="http://artincidence.fr/">Annabel Gueredrat of Martinique</a>, whose own performances involving dance, music and vocalizations in the nude.`;

console.log('='.repeat(80));
console.log('TESTING ACTUAL WORDPRESS HTML STRUCTURE');
console.log('='.repeat(80));
console.log();
console.log('Input (WordPress HTML without <p> tags):');
console.log(actualWordPressHTML);
console.log();
console.log('='.repeat(80));
console.log();

const result = ContentTransformer.htmlToPortableText(actualWordPressHTML);

console.log('Output Portable Text:');
console.log(JSON.stringify(result, null, 2));
console.log();
console.log('='.repeat(80));
console.log();

// Analysis
console.log('ANALYSIS:');
console.log();
result.forEach((block, i) => {
  if (block._type === 'block') {
    const text = block.children.map(child => child.text || '').join('');
    console.log(`Block ${i + 1}: "${text.substring(0, 60)}..."`);
  } else {
    console.log(`Block ${i + 1}: [${block._type}]`);
  }
});

console.log();
console.log(`Total blocks: ${result.length}`);
console.log();
console.log('PROBLEM:');
console.log('Each line of text becomes a separate block!');
console.log('The link content should be inline within the paragraph, not a separate block.');
console.log();
