const fs = require('fs');

const issuesSummary = `# Content QA Report - WordPress Import Issues

**Generated:** ${new Date().toISOString()}
**Total Posts to Review:** 294

## Executive Summary

After reviewing a sample of imported WordPress posts, several critical rendering and styling issues have been identified that affect content readability and presentation. These issues appear to be related to how WordPress HTML content was converted to Sanity's Portable Text format.

## Critical Issues Found

### 1. **CRITICAL: Inline Content Rendered as Block Paragraphs** ⚠️

**Description:** Content that should flow inline within a paragraph is being split into separate block-level paragraphs. This severely impacts readability and makes the text appear fragmented and disjointed.

**Examples:**
- Post: "Female artists and writers reflect on feminist art and journalism"
  - "There's a certain fascination that" (separate paragraph)
  - "Li Xinmo's" (separate paragraph)
  - "art seems to have with death..." (separate paragraph)
  - Should be: "There's a certain fascination that Li Xinmo's art seems to have with death..."

- Post: "Fiction Excerpt: Tender Darling"
  - "...you are so nice but" (separate paragraph)
  - "mei guanxi de" (separate paragraph)
  - ", it's ok, I have my friend's car" (separate paragraph)
  - Should be inline: "...you are so nice but mei guanxi de, it's ok, I have my friend's car"

**Impact:** HIGH - Makes content nearly unreadable in some sections

**Root Cause:** Likely related to the console warning: \`[@portabletext/react] Unknown block type "span"\`. Inline spans are being treated as blocks instead of inline elements.

---

### 2. **HIGH: WordPress Shortcodes Rendered as Plain Text** 🔧

**Description:** WordPress shortcodes (like \`[caption]\`) are appearing as raw text instead of being properly converted or removed.

**Examples:**
- Post: "Travel Essay: Hiking Huangshan helped me conquer the mountain within"
  - \`[caption id="attachment_651" align="aligncenter" width="600"]\`
  - \`Betty hiking Yellow Mountain. Credit: Betty Xiao.[/caption]\`

- Post: "Fiction Excerpt: Tender Darling"
  - \`[caption id="attachment_458" align="alignright" width="240"]\`
  - \`Photo of Nancy. Credit: Nancy L. Conyers.[/caption]\`

**Impact:** MEDIUM-HIGH - Looks unprofessional and confusing to readers

**Root Cause:** WordPress shortcodes were not processed during the HTML to Portable Text conversion.

---

### 3. **MEDIUM: Image Captions Rendered as Block Paragraphs**

**Description:** Image captions are appearing as separate paragraph elements below images instead of being properly associated with the image as a caption.

**Examples:**
- Post: "Breaking through the publishing glass ceiling"
  - Image followed by paragraph: "GeishaLegscover"
  - Image followed by paragraph: "Elaine"

- Post: "Travel Essay: Hiking Huangshan helped me conquer the mountain within"
  - Image followed by paragraph: "Yellow Mountain1"
  - Image followed by paragraph: "Yellow Mountain4"

**Impact:** MEDIUM - Captions lack proper styling and semantic meaning

---

### 4. **MEDIUM: Standalone Elements Rendered as Separate Paragraphs**

**Description:** Individual punctuation marks, URLs, and labels that should be inline are appearing as standalone paragraphs.

**Examples:**
- Post: "Breaking through the publishing glass ceiling"
  - "About the author" (paragraph)
  - Author bio (paragraph)
  - "Website:" (paragraph)
  - "www.sheridanprasso.com" (paragraph)
  - "Twitter:" (paragraph)
  - "@SheridanAsia" (paragraph)
  - Closing quotation mark as standalone paragraph: \`"\`

**Impact:** MEDIUM - Poor formatting and wasted vertical space

---

### 5. **LOW: Horizontal Rule Markers as Text**

**Description:** Markdown/text separators like "---" are rendering as paragraph text instead of being converted to proper horizontal rule elements.

**Examples:**
- Post: "Fiction Excerpt: Tender Darling"
  - "---" appears as plain text paragraph instead of \`<hr />\`

**Impact:** LOW - Minor visual issue

---

## Sample Posts Reviewed

Screenshots captured for the following posts:

1. ✅ **breaking-through-the-publishing-glass-ceiling-a-tribute-to-my-literary-agent**
   - Issues: #1 (inline content as blocks), #3 (image captions), #4 (standalone elements)
   - Screenshot: \`.playwright-mcp/post-1-breaking-through-publishing.png\`

2. ✅ **hiking-huangshan-helped-me-conquer-the-mountain-within**
   - Issues: #2 (WordPress shortcodes), #3 (image captions)
   - Screenshot: \`.playwright-mcp/post-2-hiking-huangshan.png\`

3. ✅ **female-artists-and-writers-reflect-on-feminist-art-and-journalism**
   - Issues: #1 (SEVERE - inline content as blocks), #3 (image captions), #4 (standalone elements)
   - Screenshot: \`.playwright-mcp/post-3-feminist-art-journalism.png\`

4. ✅ **tender-darling**
   - Issues: #1 (inline content as blocks), #2 (WordPress shortcodes), #3 (image captions), #4 (standalone elements), #5 (horizontal rules)
   - Screenshot: \`.playwright-mcp/post-4-tender-darling.png\`

---

## Technical Notes

### Console Warnings Observed

\`\`\`
[@portabletext/react] Unknown block type "span", specify a component for it in the components.types prop
\`\`\`

This warning appears repeatedly and is likely the root cause of Issue #1. The Portable Text renderer doesn't know how to handle "span" type blocks, suggesting that inline spans were incorrectly converted to block-level elements during the WordPress to Sanity migration.

### Affected Files

Based on the codebase structure, the issue likely stems from:
- \`nuvoices-studio/import/transformers.js\` - HTML to Portable Text conversion
- \`nuvoices-web/src/components/*\` - Portable Text rendering components
- Portable Text configuration in the Next.js app

---

## Recommendations

1. **Fix Issue #1 (Critical):** Update the HTML to Portable Text transformer to properly handle inline elements (spans, emphasis, links within paragraphs) as inline marks rather than separate blocks.

2. **Fix Issue #2 (High):** Pre-process WordPress shortcodes before or during HTML conversion:
   - Convert caption shortcodes to proper image caption structure
   - Remove or convert other WordPress-specific shortcodes

3. **Fix Issue #3 (Medium):** Ensure image captions are properly associated with images in the Portable Text structure and styled appropriately.

4. **Fix Issue #4 (Medium):** Review the paragraph splitting logic in the transformer to avoid creating separate blocks for inline elements.

5. **Fix Issue #5 (Low):** Add logic to convert "---" markers to proper horizontal rule blocks.

---

## Next Steps

1. ❌ Review all 294 posts (NOT DONE - initial sample review completed)
2. ✅ Document common issues (COMPLETED)
3. ⏳ **DO NOT FIX** - Per user instructions, issues are documented for future resolution
4. ⏳ Consider re-running import with improved transformers

---

## Full Post List

| # | Title | Slug | Status | Issues |
|---|-------|------|--------|--------|
`;

const posts = require('./posts.json');

let postList = '';
posts.forEach((post, index) => {
  postList += `| ${index + 1} | ${post.title} | \`${post.slug}\` | ⏳ Pending Review | |\n`;
});

const fullContent = issuesSummary + postList;

fs.writeFileSync('../../CONTENT_QA.md', fullContent);
console.log('CONTENT_QA.md updated with detailed issue analysis!');
