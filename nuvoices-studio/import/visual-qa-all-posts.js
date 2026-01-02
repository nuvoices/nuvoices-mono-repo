#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Extract slugs from CONTENT_QA.md
function extractSlugs() {
  const qaPath = path.join(__dirname, '../../CONTENT_QA.md');
  const content = fs.readFileSync(qaPath, 'utf-8');

  const slugs = [];
  const slugRegex = /\| \d+ \| .+ \| `([^`]+)` \|/g;
  let match;

  while ((match = slugRegex.exec(content)) !== null) {
    slugs.push(match[1]);
  }

  return slugs;
}

async function main() {
  const slugs = extractSlugs();
  console.log(`📋 Extracted ${slugs.length} post slugs from CONTENT_QA.md\n`);

  // Save slugs to a temporary file for the Playwright script
  const slugsPath = path.join(__dirname, 'post-slugs.json');
  fs.writeFileSync(slugsPath, JSON.stringify(slugs, null, 2));

  console.log(`✅ Saved slugs to: ${slugsPath}`);
  console.log(`\nNext: Use Playwright MCP to visit each post at:`);
  console.log(`  http://localhost:3000/magazine/<slug>`);
  console.log(`\nSlugs ready for visual QA!`);
}

main();
