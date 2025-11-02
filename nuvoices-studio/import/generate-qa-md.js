const fs = require('fs');
const posts = require('./posts.json');

let markdown = `# Content QA Report

**Total Posts:** ${posts.length}
**Generated:** ${new Date().toISOString()}

## Posts to Review

| # | Title | Slug | Status | Issues |
|---|-------|------|--------|--------|
`;

posts.forEach((post, index) => {
  markdown += `| ${index + 1} | ${post.title} | \`${post.slug}\` | ⏳ Pending | |\n`;
});

markdown += `
## QA Process

For each post:
1. Visit \`/magazine/<slug>\` on local dev server
2. Capture Playwright snapshot
3. Check for rendering issues:
   - Image captions (inline vs block)
   - Content formatting
   - Styling inconsistencies
4. Document issues in the table above

## Common Issues to Look For

- Image captions rendered as block elements instead of inline
- Content that should be inline but is rendered as block
- Missing or broken images
- Formatting inconsistencies
- Typography issues
`;

fs.writeFileSync('../../CONTENT_QA.md', markdown);
console.log('CONTENT_QA.md generated successfully!');
