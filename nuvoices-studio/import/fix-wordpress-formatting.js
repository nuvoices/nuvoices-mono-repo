const fs = require('fs');
const { JSDOM } = require('jsdom');

/**
 * This script fixes WordPress content that lacks proper paragraph tags.
 *
 * Problem: Some WordPress posts export raw text and inline elements without
 * wrapping them in <p> tags, causing the transformer to treat each text node
 * and inline element as a separate block.
 *
 * Solution: Wrap consecutive text nodes and inline elements in <p> tags.
 */

class WordPressContentFixer {
  constructor() {
    this.inlineElements = new Set([
      'a', 'strong', 'b', 'em', 'i', 'span', 'code', 'sup', 'sub',
      'abbr', 'acronym', 'cite', 'del', 'ins', 'kbd', 'mark', 's',
      'samp', 'small', 'strike', 'u', 'var'
    ]);

    this.blockElements = new Set([
      'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
      'ul', 'ol', 'li', 'pre', 'table', 'tr', 'td', 'th', 'figure',
      'hr', 'iframe', 'img'
    ]);
  }

  /**
   * Check if content needs fixing (has bare text/inline elements)
   */
  needsFixing(html) {
    if (!html || html.trim() === '') return false;

    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    // Check if there are text nodes or inline elements at the body level
    for (const child of body.childNodes) {
      if (child.nodeType === 3) { // Text node
        const text = child.textContent.trim();
        if (text) {
          return true; // Bare text node found
        }
      } else if (child.nodeType === 1) { // Element node
        const tagName = child.tagName.toLowerCase();
        if (this.inlineElements.has(tagName)) {
          return true; // Bare inline element found
        }
      }
    }

    return false;
  }

  /**
   * Fix content by wrapping bare text/inline elements in <p> tags
   */
  fixContent(html) {
    if (!html || html.trim() === '') return html;

    const dom = new JSDOM(html);
    const body = dom.window.document.body;
    const document = dom.window.document;

    const newChildren = [];
    let currentParagraph = null;

    for (const child of Array.from(body.childNodes)) {
      const shouldWrap = this.shouldWrapInParagraph(child);

      if (shouldWrap) {
        // Add to current paragraph or create new one
        if (!currentParagraph) {
          currentParagraph = document.createElement('p');
        }
        currentParagraph.appendChild(child.cloneNode(true));
      } else {
        // Block-level element or significant whitespace-only text
        // Flush current paragraph if exists
        if (currentParagraph) {
          newChildren.push(currentParagraph);
          currentParagraph = null;
        }

        // Add block element if it's not just whitespace
        if (child.nodeType === 1 || (child.nodeType === 3 && child.textContent.trim())) {
          newChildren.push(child.cloneNode(true));
        }
      }
    }

    // Flush any remaining paragraph
    if (currentParagraph) {
      newChildren.push(currentParagraph);
    }

    // Replace body content
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }

    newChildren.forEach(child => body.appendChild(child));

    return body.innerHTML;
  }

  /**
   * Determine if a node should be wrapped in a paragraph
   */
  shouldWrapInParagraph(node) {
    if (node.nodeType === 3) {
      // Text node - wrap if not just whitespace
      return node.textContent.trim().length > 0;
    }

    if (node.nodeType === 1) {
      // Element node
      const tagName = node.tagName.toLowerCase();

      // Wrap inline elements
      if (this.inlineElements.has(tagName)) {
        return true;
      }

      // Don't wrap block elements
      if (this.blockElements.has(tagName)) {
        return false;
      }

      // For unknown elements, treat as inline if they have inline content
      return true;
    }

    return false;
  }

  /**
   * Analyze XML file to find posts that need fixing
   */
  analyzeXML(xmlPath) {
    console.log('Reading XML file...');
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

    // Find all <content:encoded> sections
    const contentRegex = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/g;
    const matches = Array.from(xmlContent.matchAll(contentRegex));

    console.log(`Found ${matches.length} posts to analyze\n`);

    let needsFixCount = 0;
    const problematicPosts = [];

    matches.forEach((match, index) => {
      const content = match[1];

      if (this.needsFixing(content)) {
        needsFixCount++;

        // Extract post title for reference (look backwards in XML)
        const beforeContent = xmlContent.substring(Math.max(0, match.index - 1000), match.index);
        const titleMatch = beforeContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const title = titleMatch ? titleMatch[1] : 'Unknown';

        problematicPosts.push({
          index: index + 1,
          title,
          contentPreview: content.substring(0, 200)
        });
      }
    });

    console.log('='.repeat(80));
    console.log(`ANALYSIS RESULTS:`);
    console.log('='.repeat(80));
    console.log(`Total posts: ${matches.length}`);
    console.log(`Posts needing fixes: ${needsFixCount} (${Math.round(needsFixCount/matches.length*100)}%)`);
    console.log(`Posts already formatted correctly: ${matches.length - needsFixCount}`);
    console.log();

    if (problematicPosts.length > 0) {
      console.log('Sample of posts that need fixing:');
      console.log('-'.repeat(80));
      problematicPosts.slice(0, 10).forEach(post => {
        console.log(`[${post.index}] ${post.title}`);
        console.log(`    Preview: ${post.contentPreview.substring(0, 100)}...`);
        console.log();
      });

      if (problematicPosts.length > 10) {
        console.log(`... and ${problematicPosts.length - 10} more\n`);
      }
    }

    return { total: matches.length, needsFix: needsFixCount };
  }

  /**
   * Fix all posts in XML file
   */
  fixXML(inputPath, outputPath) {
    console.log('\n' + '='.repeat(80));
    console.log('FIXING XML FILE');
    console.log('='.repeat(80));
    console.log(`Reading: ${inputPath}`);

    let xmlContent = fs.readFileSync(inputPath, 'utf8');
    let fixedCount = 0;

    // Process each <content:encoded> section
    xmlContent = xmlContent.replace(
      /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/g,
      (match, content) => {
        if (this.needsFixing(content)) {
          fixedCount++;
          const fixed = this.fixContent(content);
          return `<content:encoded><![CDATA[${fixed}]]></content:encoded>`;
        }
        return match;
      }
    );

    console.log(`\nFixed ${fixedCount} posts`);
    console.log(`Writing to: ${outputPath}`);

    fs.writeFileSync(outputPath, xmlContent, 'utf8');

    console.log('✅ Done!\n');

    return fixedCount;
  }
}

// Main execution
async function main() {
  const fixer = new WordPressContentFixer();

  const inputFile = './nuvoices.xml.original';
  const outputFile = './nuvoices.xml';

  console.log('\n' + '='.repeat(80));
  console.log('WORDPRESS CONTENT FORMATTER');
  console.log('='.repeat(80));
  console.log();
  console.log('This tool fixes WordPress posts that lack proper <p> tag wrapping.');
  console.log();

  // Step 1: Analyze
  console.log('STEP 1: Analyzing XML file...\n');
  const analysis = fixer.analyzeXML(inputFile);

  // Step 2: Ask for confirmation
  if (analysis.needsFix === 0) {
    console.log('✅ No posts need fixing! All content is properly formatted.\n');
    return;
  }

  console.log('='.repeat(80));
  console.log(`Ready to fix ${analysis.needsFix} posts.`);
  console.log(`Original file: ${inputFile}`);
  console.log(`Output file: ${outputFile}`);
  console.log('='.repeat(80));
  console.log();

  // Step 3: Fix
  const fixedCount = fixer.fixXML(inputFile, outputFile);

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Fixed ${fixedCount} posts`);
  console.log(`📝 Original file backed up at: ${inputFile}`);
  console.log(`📝 Fixed file saved to: ${outputFile}`);
  console.log();
  console.log('Next steps:');
  console.log('1. Review some fixed posts to verify the changes');
  console.log('2. Re-run the import: npm run import:posts');
  console.log();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
