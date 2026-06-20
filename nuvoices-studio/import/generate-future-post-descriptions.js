'use strict';

/**
 * Generate neutral AI descriptions for the 6 "future" posts.
 * Uses the same Claude CLI approach as generate-new-post-descriptions.js.
 *
 * Usage:
 *   node generate-future-post-descriptions.js
 *
 * Output:
 *   output/future-descriptions-neutral.csv
 *
 * Then apply with:
 *   node update-single-post.js --descriptions-csv output/future-descriptions-neutral.csv --production
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const FUTURE_POST_IDS = [4190, 4193, 4218, 4220, 4222, 4272];

// ---------------------------------------------------------------------------
// Helpers (same as generate-new-post-descriptions.js)
// ---------------------------------------------------------------------------

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '\u2026');
}

function csvEscape(val) {
  return '"' + String(val).replace(/"/g, '""') + '"';
}

function csvRow(postId, title, description) {
  return [csvEscape(postId), csvEscape(title), csvEscape(description)].join(',');
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const transport = urlObj.protocol === 'https:' ? https : require('http');
    transport.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJSON(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function buildPrompt(title, content) {
  const truncated = content.slice(0, 2000);
  return (
    `Write a 1-2 sentence neutral summary (max 280 characters) for a New Voices magazine post titled '${title}'. ` +
    `Use plain factual language. Output ONLY the description, no quotes or preamble. ` +
    `Content: ${truncated}`
  );
}

function callClaude(prompt) {
  const result = execSync('claude -p -', {
    input: prompt,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 60000,
  });
  return result.trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const CSV_HEADER = [csvEscape('post_id'), csvEscape('title'), csvEscape('description')].join(',');

async function main() {
  const ids = FUTURE_POST_IDS.join(',');
  const wpApiUrl = `https://nuvoicesprod.wpenginepowered.com/wp-json/wp/v2/posts?include=${ids}&per_page=${FUTURE_POST_IDS.length}`;

  console.log('Fetching posts from WordPress REST API...');
  const wpPosts = await fetchJSON(wpApiUrl);
  console.log(`Fetched ${wpPosts.length} posts\n`);

  const rows = [];
  let successCount = 0;

  for (let i = 0; i < wpPosts.length; i++) {
    const post = wpPosts[i];
    const title = decodeHtmlEntities(post.title.rendered);
    const strippedContent = stripHtml(post.content.rendered);

    if (strippedContent.length < 50) {
      console.log(`Skipping "${title}" — content too short`);
      continue;
    }

    try {
      const prompt = buildPrompt(title, strippedContent);
      const description = callClaude(prompt);
      rows.push(csvRow(post.id, title, description));
      successCount++;
      console.log(`[${successCount}/${wpPosts.length}] "${title}"`);
      console.log(`  -> ${description}\n`);
    } catch (err) {
      console.log(`Failed "${title}": ${err.message}`);
    }
  }

  // Write output file
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, 'future-descriptions-neutral.csv');
  const content = [CSV_HEADER, ...rows].join('\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Wrote ${filePath}`);

  console.log(`\nDone: ${successCount} posts.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
