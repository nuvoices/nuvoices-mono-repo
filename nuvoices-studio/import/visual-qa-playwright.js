#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Sample of posts to check (covering different issues from CONTENT_QA.md)
const POSTS_TO_CHECK = [
  // Issue #1 - Inline content as blocks
  { slug: 'female-artists-and-writers-reflect-on-feminist-art-and-journalism', title: 'Female artists and writers reflect', issues: ['#1'] },
  { slug: 'tender-darling', title: 'Fiction Excerpt: Tender Darling', issues: ['#1', '#2', '#5'] },

  // Issue #2 - WordPress shortcodes
  { slug: 'hiking-huangshan-helped-me-conquer-the-mountain-within', title: 'Hiking Huangshan', issues: ['#2'] },

  // Issue #3 & #4 - Image captions and standalone elements
  { slug: 'breaking-through-the-publishing-glass-ceiling-a-tribute-to-my-literary-agent', title: 'Breaking through publishing glass ceiling', issues: ['#3', '#4'] },

  // Additional samples
  { slug: 'distances', title: 'Personal Essay: Distances', issues: [] },
  { slug: 'hong-kongs-lesbian-spaces-and-the-stories-behind-them', title: 'Hong Kong lesbian spaces', issues: [] },
  { slug: 'podcast-joan-xu-on-screenwriting-in-china', title: 'NüVoices Podcast #5', issues: [] },
  { slug: 'personal-essay-by-a-chinese-adoptee-i-returned-to-china-find-my-biological-family-and-cultural-roots', title: 'Chinese adoptee essay', issues: [] },
  { slug: 'femininity-through-the-eyes-of-five-female-chinese-artists', title: 'Five female Chinese artists', issues: [] },
  { slug: 'meet-the-queer-women-organizers-of-shanghais-lgbtq-community', title: 'Shanghai LGBTQ organizers', issues: [] },
];

const BASE_URL = 'http://localhost:3000';

async function checkPost(page, post) {
  const url = `${BASE_URL}/magazine/${post.slug}`;
  const issues = [];

  try {
    console.log(`\n🔍 Checking: ${post.title}`);
    console.log(`   URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for content to load
    await page.waitForSelector('article', { timeout: 10000 }).catch(() => null);

    // Check for console errors (especially the span block error)
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = msg.text();
        if (text.includes('Unknown block type') || text.includes('span')) {
          consoleErrors.push(text);
        }
      }
    });

    // Check 1: Look for WordPress shortcodes in text
    const bodyText = await page.textContent('body');
    if (bodyText.includes('[caption')) {
      issues.push({
        type: 'HIGH',
        issue: 'WordPress [caption] shortcode visible',
        details: 'Found [caption] text in rendered content'
      });
    }
    if (bodyText.includes('[/caption]')) {
      issues.push({
        type: 'HIGH',
        issue: 'WordPress [/caption] closing tag visible',
        details: 'Found [/caption] text in rendered content'
      });
    }

    // Check 2: Look for suspiciously short paragraphs (Issue #1, #4)
    const paragraphs = await page.$$eval('p', ps =>
      ps.map(p => p.textContent.trim()).filter(t => t.length > 0 && t.length < 50)
    );

    const problematicParagraphs = paragraphs.filter(p => {
      // Single punctuation
      if (/^["""''':,;.\-—]+$/.test(p)) return true;
      // Labels like "Website:" or "Twitter:"
      if (/^(Website|Twitter|Email|Phone):\s*$/.test(p)) return true;
      // Very short content that might be fragmented
      if (p.length < 10 && p.split(/\s+/).length <= 2) return true;
      return false;
    });

    if (problematicParagraphs.length > 0) {
      issues.push({
        type: 'MEDIUM',
        issue: 'Suspicious short paragraphs detected',
        details: `Found ${problematicParagraphs.length} short paragraphs: ${problematicParagraphs.slice(0, 3).join(', ')}${problematicParagraphs.length > 3 ? '...' : ''}`
      });
    }

    // Check 3: Look for "---" as text (Issue #5)
    const hasTextHR = paragraphs.some(p => p === '---' || p === '—' || p === '–');
    if (hasTextHR) {
      issues.push({
        type: 'LOW',
        issue: 'Horizontal rule marker as text',
        details: 'Found "---" rendered as text instead of <hr>'
      });
    }

    // Check 4: Count images and check for captions
    const images = await page.$$('article img');
    const imagesWithoutAlt = await page.$$eval('article img', imgs =>
      imgs.filter(img => !img.alt || img.alt.trim() === '').length
    );

    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'INFO',
        issue: 'Images without alt text',
        details: `${imagesWithoutAlt} out of ${images.length} images missing alt text`
      });
    }

    // Check 5: Look for broken images
    const brokenImages = await page.$$eval('article img', imgs => {
      return imgs.filter(img => {
        return !img.complete || img.naturalHeight === 0;
      }).map(img => img.src);
    });

    if (brokenImages.length > 0) {
      issues.push({
        type: 'MEDIUM',
        issue: 'Broken images detected',
        details: `${brokenImages.length} images failed to load`
      });
    }

    // Take screenshot
    const screenshotDir = path.join(__dirname, 'qa-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, `${post.slug.substring(0, 50)}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`   📸 Screenshot saved: ${screenshotPath}`);
    console.log(`   ${issues.length === 0 ? '✅ No issues found!' : `⚠️  Found ${issues.length} issue(s)`}`);

    if (issues.length > 0) {
      issues.forEach(issue => {
        const icon = issue.type === 'HIGH' ? '🔴' : issue.type === 'MEDIUM' ? '🟡' : issue.type === 'LOW' ? '🔵' : 'ℹ️';
        console.log(`      ${icon} [${issue.type}] ${issue.issue}`);
        console.log(`         ${issue.details}`);
      });
    }

    return {
      slug: post.slug,
      title: post.title,
      url,
      screenshot: screenshotPath,
      issues,
      expectedIssues: post.issues
    };

  } catch (error) {
    console.log(`   ❌ Error checking post: ${error.message}`);
    return {
      slug: post.slug,
      title: post.title,
      url,
      error: error.message,
      issues: [{
        type: 'CRITICAL',
        issue: 'Failed to load page',
        details: error.message
      }]
    };
  }
}

async function main() {
  console.log('🚀 Starting Visual QA with Playwright...\n');
  console.log(`📋 Checking ${POSTS_TO_CHECK.length} sample posts\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1024 }
  });
  const page = await context.newPage();

  const results = [];

  for (const post of POSTS_TO_CHECK) {
    const result = await checkPost(page, post);
    results.push(result);

    // Small delay between requests
    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Generate summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 VISUAL QA SUMMARY');
  console.log('═'.repeat(70));

  const postsWithIssues = results.filter(r => r.issues && r.issues.length > 0);
  const criticalIssues = results.flatMap(r => r.issues || []).filter(i => i.type === 'CRITICAL').length;
  const highIssues = results.flatMap(r => r.issues || []).filter(i => i.type === 'HIGH').length;
  const mediumIssues = results.flatMap(r => r.issues || []).filter(i => i.type === 'MEDIUM').length;
  const lowIssues = results.flatMap(r => r.issues || []).filter(i => i.type === 'LOW').length;

  console.log(`Total Posts Checked: ${results.length}`);
  console.log(`Posts with Issues: ${postsWithIssues.length} (${((postsWithIssues.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`Posts Clean: ${results.length - postsWithIssues.length}\n`);

  console.log('Issues by Severity:');
  if (criticalIssues > 0) console.log(`   🔴 CRITICAL: ${criticalIssues}`);
  if (highIssues > 0) console.log(`   🟠 HIGH: ${highIssues}`);
  if (mediumIssues > 0) console.log(`   🟡 MEDIUM: ${mediumIssues}`);
  if (lowIssues > 0) console.log(`   🔵 LOW: ${lowIssues}`);
  if (criticalIssues === 0 && highIssues === 0 && mediumIssues === 0 && lowIssues === 0) {
    console.log(`   ✅ No issues found!`);
  }

  // Save detailed report
  const reportPath = path.join(__dirname, 'VISUAL_QA_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    generated: new Date().toISOString(),
    summary: {
      total: results.length,
      withIssues: postsWithIssues.length,
      clean: results.length - postsWithIssues.length,
      critical: criticalIssues,
      high: highIssues,
      medium: mediumIssues,
      low: lowIssues
    },
    results
  }, null, 2));

  console.log(`\n📝 Detailed report saved to: ${reportPath}\n`);

  // Print posts with critical/high issues
  const criticalPosts = results.filter(r =>
    r.issues && r.issues.some(i => i.type === 'CRITICAL' || i.type === 'HIGH')
  );

  if (criticalPosts.length > 0) {
    console.log(`\n🔴 ${criticalPosts.length} Posts with CRITICAL/HIGH Issues:\n`);
    criticalPosts.forEach(post => {
      console.log(`   • ${post.title}`);
      post.issues.filter(i => i.type === 'CRITICAL' || i.type === 'HIGH').forEach(issue => {
        console.log(`     - [${issue.type}] ${issue.issue}`);
      });
    });
    process.exit(1);
  } else {
    console.log('\n✅ No CRITICAL or HIGH issues found!\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
