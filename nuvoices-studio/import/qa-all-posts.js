#!/usr/bin/env node

const { createClient } = require('@sanity/client');
const fs = require('fs');

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '6bg89hff',
  dataset: process.env.SANITY_STUDIO_DATASET || 'staging2',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false
});

// QA Check Criteria
const qaChecks = {
  // Issue #1 & #4: Check for invalid block structures
  invalidBlockStructure: (post) => {
    const issues = [];
    if (!post.body || !Array.isArray(post.body)) return issues;

    post.body.forEach((block, idx) => {
      // Check for span-type blocks (should be within block children, not top-level)
      if (block._type === 'span') {
        issues.push({
          type: 'CRITICAL',
          issue: 'Span as top-level block (Issue #1)',
          location: `Body block ${idx}`,
          details: `Found _type: "span" at top level`
        });
      }

      // Check for blocks with invalid markDefs (Issue #1)
      if (block._type === 'block' && block.children) {
        block.children.forEach((child, childIdx) => {
          if (child.marks && Array.isArray(child.marks)) {
            child.marks.forEach(mark => {
              // Mark should be a string reference, not an object
              if (typeof mark === 'object') {
                issues.push({
                  type: 'CRITICAL',
                  issue: 'Invalid mark structure (Issue #1)',
                  location: `Body block ${idx}, child ${childIdx}`,
                  details: `Mark is object instead of string reference`
                });
              }
            });
          }
        });
      }

      // Check for suspiciously short blocks (Issue #4)
      if (block._type === 'block' && block.children) {
        const text = block.children.map(c => c.text || '').join('');
        const trimmed = text.trim();

        // Flag single punctuation marks or very short standalone content
        if (trimmed.length > 0 && trimmed.length <= 3 &&
            /^["':,;.\-—]+$/.test(trimmed)) {
          issues.push({
            type: 'MEDIUM',
            issue: 'Standalone punctuation block (Issue #4)',
            location: `Body block ${idx}`,
            details: `Block contains only: "${trimmed}"`
          });
        }

        // Flag "Website:" or "Twitter:" style labels
        if (/^(Website|Twitter|Email|Phone):\s*$/.test(trimmed)) {
          issues.push({
            type: 'MEDIUM',
            issue: 'Standalone label block (Issue #4)',
            location: `Body block ${idx}`,
            details: `Block contains only: "${trimmed}"`
          });
        }
      }
    });

    return issues;
  },

  // Issue #2: Check for WordPress shortcodes
  wordpressShortcodes: (post) => {
    const issues = [];
    if (!post.body || !Array.isArray(post.body)) return issues;

    post.body.forEach((block, idx) => {
      if (block._type === 'block' && block.children) {
        const text = block.children.map(c => c.text || '').join('');

        // Check for [caption] shortcodes
        if (text.includes('[caption')) {
          issues.push({
            type: 'HIGH',
            issue: 'WordPress caption shortcode not converted (Issue #2)',
            location: `Body block ${idx}`,
            details: 'Contains [caption] shortcode'
          });
        }

        // Check for other common WordPress shortcodes
        const shortcodes = text.match(/\[(?:embed|gallery|audio|video|playlist)\b[^\]]*\]/g);
        if (shortcodes) {
          issues.push({
            type: 'HIGH',
            issue: 'WordPress shortcode not converted (Issue #2)',
            location: `Body block ${idx}`,
            details: `Contains shortcodes: ${shortcodes.join(', ')}`
          });
        }

        // Check for [/caption] closing tags
        if (text.includes('[/caption]')) {
          issues.push({
            type: 'HIGH',
            issue: 'WordPress caption closing tag not removed (Issue #2)',
            location: `Body block ${idx}`,
            details: 'Contains [/caption] closing tag'
          });
        }
      }
    });

    return issues;
  },

  // Issue #3: Check for image captions
  imageCaptions: (post) => {
    const issues = [];
    if (!post.body || !Array.isArray(post.body)) return issues;

    post.body.forEach((block, idx) => {
      if (block._type === 'image') {
        // Check if image has a caption field
        if (!block.caption || block.caption.trim() === '') {
          // This might be intentional, so mark as INFO not error
          issues.push({
            type: 'INFO',
            issue: 'Image without caption (Issue #3)',
            location: `Body block ${idx}`,
            details: 'Image block has no caption property'
          });
        }
      }

      // Check for paragraph immediately after image that looks like a caption
      if (idx > 0 && post.body[idx - 1]._type === 'image' && block._type === 'block') {
        const text = block.children?.map(c => c.text || '').join('').trim() || '';
        // Caption-like patterns
        if (text.length < 150 &&
            (text.includes('Credit:') ||
             text.includes('Photo by') ||
             text.includes('Image:') ||
             /^[A-Z][a-z]+\d+$/.test(text))) { // e.g., "Yellow Mountain1"
          issues.push({
            type: 'MEDIUM',
            issue: 'Potential caption as separate paragraph (Issue #3)',
            location: `Body block ${idx}`,
            details: `Text after image: "${text.substring(0, 50)}..."`
          });
        }
      }
    });

    return issues;
  },

  // Issue #5: Check horizontal rules
  horizontalRules: (post) => {
    const issues = [];
    if (!post.body || !Array.isArray(post.body)) return issues;

    post.body.forEach((block, idx) => {
      if (block._type === 'block' && block.children) {
        const text = block.children.map(c => c.text || '').join('').trim();

        // Check for "---" as text
        if (text === '---' || text === '—' || text === '–') {
          issues.push({
            type: 'LOW',
            issue: 'Horizontal rule marker as text (Issue #5)',
            location: `Body block ${idx}`,
            details: `Block contains "${text}" instead of horizontalRule type`
          });
        }
      }
    });

    return issues;
  }
};

// Generate summary statistics
function generateSummary(results) {
  const summary = {
    totalPosts: results.length,
    postsWithIssues: 0,
    issuesByType: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0
    },
    issuesByCategory: {
      'Issue #1': 0,
      'Issue #2': 0,
      'Issue #3': 0,
      'Issue #4': 0,
      'Issue #5': 0
    }
  };

  results.forEach(result => {
    if (result.issues.length > 0) {
      summary.postsWithIssues++;
    }

    result.issues.forEach(issue => {
      summary.issuesByType[issue.type]++;

      // Extract issue number from issue text
      const match = issue.issue.match(/Issue #(\d+)/);
      if (match) {
        const issueKey = `Issue #${match[1]}`;
        summary.issuesByCategory[issueKey]++;
      }
    });
  });

  return summary;
}

// Main QA function
async function runQA() {
  console.log('🔍 Starting comprehensive QA check on all posts...\n');

  try {
    // Fetch all posts
    console.log('📥 Fetching posts from Sanity...');
    const posts = await client.fetch(`
      *[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        publishedAt,
        body
      }
    `);

    console.log(`✅ Found ${posts.length} posts\n`);
    console.log('⚙️  Running QA checks...\n');

    const results = [];

    posts.forEach((post, index) => {
      const postIssues = [];

      // Run all QA checks
      Object.entries(qaChecks).forEach(([checkName, checkFn]) => {
        const issues = checkFn(post);
        postIssues.push(...issues);
      });

      results.push({
        id: post._id,
        title: post.title,
        slug: post.slug?.current || 'no-slug',
        publishedAt: post.publishedAt,
        issues: postIssues
      });

      // Progress indicator
      if ((index + 1) % 50 === 0) {
        console.log(`   Checked ${index + 1}/${posts.length} posts...`);
      }
    });

    console.log(`   Checked ${posts.length}/${posts.length} posts ✓\n`);

    // Generate summary
    const summary = generateSummary(results);

    // Display summary
    console.log('═'.repeat(70));
    console.log('📊 QA SUMMARY');
    console.log('═'.repeat(70));
    console.log(`Total Posts Checked: ${summary.totalPosts}`);
    console.log(`Posts with Issues: ${summary.postsWithIssues} (${((summary.postsWithIssues / summary.totalPosts) * 100).toFixed(1)}%)`);
    console.log(`Posts Clean: ${summary.totalPosts - summary.postsWithIssues} (${(((summary.totalPosts - summary.postsWithIssues) / summary.totalPosts) * 100).toFixed(1)}%)`);

    console.log('\n📈 Issues by Severity:');
    Object.entries(summary.issuesByType).forEach(([type, count]) => {
      if (count > 0) {
        const icon = type === 'CRITICAL' ? '🔴' : type === 'HIGH' ? '🟠' : type === 'MEDIUM' ? '🟡' : type === 'LOW' ? '🔵' : 'ℹ️';
        console.log(`   ${icon} ${type}: ${count}`);
      }
    });

    console.log('\n🏷️  Issues by Category:');
    Object.entries(summary.issuesByCategory).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`   ${category}: ${count}`);
      }
    });

    console.log('\n' + '═'.repeat(70));

    // Show posts with critical/high issues
    const criticalPosts = results.filter(r =>
      r.issues.some(i => i.type === 'CRITICAL' || i.type === 'HIGH')
    );

    if (criticalPosts.length > 0) {
      console.log(`\n🔴 ${criticalPosts.length} Posts with CRITICAL/HIGH Issues:\n`);
      criticalPosts.slice(0, 10).forEach(post => {
        console.log(`   • ${post.title}`);
        post.issues.forEach(issue => {
          if (issue.type === 'CRITICAL' || issue.type === 'HIGH') {
            console.log(`     - [${issue.type}] ${issue.issue}`);
            console.log(`       ${issue.details}`);
          }
        });
        console.log('');
      });

      if (criticalPosts.length > 10) {
        console.log(`   ... and ${criticalPosts.length - 10} more\n`);
      }
    } else {
      console.log('\n✅ No CRITICAL or HIGH issues found!\n');
    }

    // Save detailed report
    const reportPath = './QA_REPORT_DETAILED.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      generated: new Date().toISOString(),
      summary,
      results: results.filter(r => r.issues.length > 0) // Only save posts with issues
    }, null, 2));

    console.log(`📝 Detailed report saved to: ${reportPath}\n`);

    // Save summary to markdown
    const mdPath = './QA_REPORT_SUMMARY.md';
    let mdContent = `# QA Report Summary\n\n`;
    mdContent += `**Generated:** ${new Date().toISOString()}\n\n`;
    mdContent += `## Summary\n\n`;
    mdContent += `- **Total Posts:** ${summary.totalPosts}\n`;
    mdContent += `- **Posts with Issues:** ${summary.postsWithIssues} (${((summary.postsWithIssues / summary.totalPosts) * 100).toFixed(1)}%)\n`;
    mdContent += `- **Posts Clean:** ${summary.totalPosts - summary.postsWithIssues} (${(((summary.totalPosts - summary.postsWithIssues) / summary.totalPosts) * 100).toFixed(1)}%)\n\n`;

    mdContent += `## Issues by Severity\n\n`;
    Object.entries(summary.issuesByType).forEach(([type, count]) => {
      if (count > 0) {
        mdContent += `- **${type}:** ${count}\n`;
      }
    });

    mdContent += `\n## Issues by Category\n\n`;
    Object.entries(summary.issuesByCategory).forEach(([category, count]) => {
      if (count > 0) {
        mdContent += `- **${category}:** ${count}\n`;
      }
    });

    if (criticalPosts.length > 0) {
      mdContent += `\n## Posts with CRITICAL/HIGH Issues (${criticalPosts.length})\n\n`;
      criticalPosts.forEach(post => {
        mdContent += `### ${post.title}\n\n`;
        mdContent += `- **Slug:** \`${post.slug}\`\n`;
        post.issues.forEach(issue => {
          if (issue.type === 'CRITICAL' || issue.type === 'HIGH') {
            mdContent += `- **[${issue.type}]** ${issue.issue}\n`;
            mdContent += `  - ${issue.details}\n`;
          }
        });
        mdContent += '\n';
      });
    }

    fs.writeFileSync(mdPath, mdContent);
    console.log(`📝 Summary report saved to: ${mdPath}\n`);

    // Exit code based on critical issues
    if (summary.issuesByType.CRITICAL > 0) {
      console.log('❌ QA FAILED: Critical issues found\n');
      process.exit(1);
    } else if (summary.issuesByType.HIGH > 0) {
      console.log('⚠️  QA WARNING: High priority issues found\n');
      process.exit(0);
    } else {
      console.log('✅ QA PASSED: No critical or high priority issues\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error running QA:', error);
    process.exit(1);
  }
}

// Run QA
runQA();
