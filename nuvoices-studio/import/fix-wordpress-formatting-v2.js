const fs = require('fs');
const { JSDOM } = require('jsdom');

/**
 * IMPROVED WordPress Content Fixer
 *
 * Properly splits content by paragraph breaks (double newlines)
 * and wraps each paragraph in its own <p> tag.
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

    for (const child of body.childNodes) {
      if (child.nodeType === 3) {
        const text = child.textContent.trim();
        if (text) return true;
      } else if (child.nodeType === 1) {
        const tagName = child.tagName.toLowerCase();
        if (this.inlineElements.has(tagName)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Split HTML content by paragraph breaks while preserving elements
   */
  splitByParagraphs(html) {
    const dom = new JSDOM(html);
    const body = dom.window.document.body;
    const document = dom.window.document;

    const paragraphs = [];
    let currentParagraph = [];
    let hasContent = false;

    const processNode = (node) => {
      if (node.nodeType === 3) { // Text node
        const text = node.textContent;

        // Split by double newlines (paragraph breaks)
        const parts = text.split(/\n\s*\n/);

        parts.forEach((part, index) => {
          const trimmed = part.trim();

          if (index > 0 && hasContent) {
            // New paragraph detected
            paragraphs.push(currentParagraph);
            currentParagraph = [];
            hasContent = false;
          }

          if (trimmed) {
            // Add text with single newlines preserved
            const textNode = document.createTextNode(part);
            currentParagraph.push(textNode);
            hasContent = true;
          }
        });
      } else if (node.nodeType === 1) { // Element node
        const tagName = node.tagName.toLowerCase();

        if (this.blockElements.has(tagName)) {
          // Block element - flush current paragraph and add block
          if (hasContent) {
            paragraphs.push(currentParagraph);
            currentParagraph = [];
            hasContent = false;
          }

          // Add block element as its own "paragraph"
          paragraphs.push([node.cloneNode(true)]);
        } else {
          // Inline element - add to current paragraph
          currentParagraph.push(node.cloneNode(true));
          hasContent = true;
        }
      }
    };

    Array.from(body.childNodes).forEach(processNode);

    // Flush any remaining paragraph
    if (hasContent) {
      paragraphs.push(currentParagraph);
    }

    return paragraphs;
  }

  /**
   * Fix content by properly splitting and wrapping paragraphs
   */
  fixContent(html) {
    if (!html || html.trim() === '') return html;

    const paragraphs = this.splitByParagraphs(html);

    const dom = new JSDOM();
    const document = dom.window.document;
    const container = document.createElement('div');

    paragraphs.forEach(nodeList => {
      // Check if this is a block element
      if (nodeList.length === 1 && nodeList[0].nodeType === 1) {
        const tagName = nodeList[0].tagName.toLowerCase();
        if (this.blockElements.has(tagName)) {
          // Add block element directly
          container.appendChild(nodeList[0]);
          return;
        }
      }

      // Wrap inline content in <p>
      const p = document.createElement('p');
      nodeList.forEach(node => {
        p.appendChild(node);
      });
      container.appendChild(p);
    });

    return container.innerHTML;
  }

  /**
   * Analyze XML file
   */
  analyzeXML(xmlPath) {
    console.log('Reading XML file...');
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

    const contentRegex = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/g;
    const matches = Array.from(xmlContent.matchAll(contentRegex));

    console.log(`Found ${matches.length} posts to analyze\n`);

    let needsFixCount = 0;
    const problematicPosts = [];

    matches.forEach((match, index) => {
      const content = match[1];

      if (this.needsFixing(content)) {
        needsFixCount++;

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
      problematicPosts.slice(0, 5).forEach(post => {
        console.log(`[${post.index}] ${post.title}`);
        console.log(`    Preview: ${post.contentPreview.substring(0, 100)}...`);
        console.log();
      });

      if (problematicPosts.length > 5) {
        console.log(`... and ${problematicPosts.length - 5} more\n`);
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

async function main() {
  const fixer = new WordPressContentFixer();

  const inputFile = './nuvoices.xml.original';
  const outputFile = './nuvoices.xml';

  console.log('\n' + '='.repeat(80));
  console.log('WORDPRESS CONTENT FORMATTER V2');
  console.log('='.repeat(80));
  console.log();
  console.log('This tool properly splits content by paragraph breaks (double newlines)');
  console.log('and wraps each paragraph in its own <p> tag.');
  console.log();

  const analysis = fixer.analyzeXML(inputFile);

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

  const fixedCount = fixer.fixXML(inputFile, outputFile);

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Fixed ${fixedCount} posts`);
  console.log(`📝 Original file backed up at: ${inputFile}`);
  console.log(`📝 Fixed file saved to: ${outputFile}`);
  console.log();
  console.log('Next steps:');
  console.log('1. Run verify-fix.js to check the changes');
  console.log('2. Re-run the import: npm run import:posts');
  console.log();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
