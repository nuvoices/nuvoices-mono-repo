const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log('Fixing post 931 HTML...\n');

// Read the XML file
const xmlPath = './nuvoices.xml';
let xml = fs.readFileSync(xmlPath, 'utf-8');

// Find post 931 - search backwards from the post_id to find the content
const post931IdTag = '<wp:post_id>931</wp:post_id>';
const post931Start = xml.indexOf(post931IdTag);
if (post931Start === -1) {
  console.error('❌ Post 931 not found in XML');
  process.exit(1);
}

// Find the <item> tag that contains this post (search backwards)
const itemStart = xml.lastIndexOf('<item>', post931Start);
if (itemStart === -1) {
  console.error('❌ Could not find <item> tag for post 931');
  process.exit(1);
}

// Find the content:encoded section within this item
const contentStart = xml.indexOf('<content:encoded><![CDATA[', itemStart);
const contentEnd = xml.indexOf(']]></content:encoded>', contentStart);

if (contentStart === -1 || contentEnd === -1 || contentStart > post931Start) {
  console.error('❌ Could not find content section for post 931');
  process.exit(1);
}

// Extract the HTML content
const cdataStart = contentStart + '<content:encoded><![CDATA['.length;
const originalHtml = xml.substring(cdataStart, contentEnd);

console.log('Original HTML structure (first 500 chars):');
console.log(originalHtml.substring(0, 500));
console.log('\n---\n');

// Fix the HTML by parsing and reconstructing
const dom = new JSDOM(originalHtml);
const document = dom.window.document;
const body = document.body;

// Get all paragraphs
const paragraphs = body.querySelectorAll('p');

paragraphs.forEach(p => {
  // Get the HTML content
  let html = p.innerHTML;

  // Fix the specific pattern: (</span><a><b>@</b><span>handle</span></a><span>)
  // Convert to: (<a href="...">@handle</a>)
  html = html.replace(
    /\(<\/span><a\s+href="([^"]+)"><b>@<\/b><span[^>]*>([^<]+)<\/span><\/a><span[^>]*>\)/g,
    '(<a href="$1">@$2</a>)'
  );

  // Also handle the pattern without the opening parenthesis
  html = html.replace(
    /<\/span><a\s+href="([^"]+)"><b>@<\/b><span[^>]*>([^<]+)<\/span><\/a><span[^>]*>/g,
    '<a href="$1">@$2</a>'
  );

  p.innerHTML = html;
});

// Get the fixed HTML
const fixedHtml = body.innerHTML;

console.log('Fixed HTML structure (first 500 chars):');
console.log(fixedHtml.substring(0, 500));
console.log('\n---\n');

// Replace in the XML
const newXml = xml.substring(0, cdataStart) + fixedHtml + xml.substring(contentEnd);

// Backup original
const backupPath = './nuvoices.xml.backup-pre-931-fix';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, xml, 'utf-8');
  console.log(`✅ Backed up original to: ${backupPath}`);
}

// Write the fixed XML
fs.writeFileSync(xmlPath, newXml, 'utf-8');
console.log(`✅ Fixed post 931 and saved to: ${xmlPath}`);
console.log('\nNext step: Re-import the post with:');
console.log('  node import.js --posts --update');
