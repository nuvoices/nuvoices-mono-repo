'use strict';

/**
 * Generate AI descriptions for the 22 new posts (not in the XML export).
 * Fetches content from the WP REST API, then calls Claude CLI to generate
 * descriptions in 3 tones, outputting CSVs identical in format to
 * generate-descriptions.js.
 *
 * Usage:
 *   node generate-new-post-descriptions.js
 *
 * Output:
 *   output/new-descriptions-editorial.csv
 *   output/new-descriptions-engaging.csv
 *   output/new-descriptions-neutral.csv
 *
 * Then apply with:
 *   node update-single-post.js --descriptions-csv output/new-descriptions-editorial.csv
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// The 22 new post IDs
const NEW_POST_IDS = [
  4419, 4415, 4411, 4400, 4397, 4388, 4386, 4353,
  4376, 4366, 4362, 4310, 4338, 4340, 4334, 4330,
  4320, 4312, 4305, 4300, 4297, 4291,
];

// ---------------------------------------------------------------------------
// Helpers (same as generate-descriptions.js)
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

function buildPrompt(tone, title, content) {
  const truncated = content.slice(0, 2000);

  switch (tone) {
    case 'editorial':
      return (
        `Write a 1-2 sentence editorial description (max 280 characters) for a New Voices magazine post titled '${title}'. ` +
        `Use third-person journalistic voice. Output ONLY the description, no quotes or preamble. ` +
        `Content: ${truncated}`
      );
    case 'engaging':
      return (
        `Write a 1-2 sentence engaging description (max 280 characters) for a New Voices magazine post titled '${title}'. ` +
        `Use an inviting reader-facing voice that draws people in. Output ONLY the description, no quotes or preamble. ` +
        `Content: ${truncated}`
      );
    case 'neutral':
      return (
        `Write a 1-2 sentence neutral summary (max 280 characters) for a New Voices magazine post titled '${title}'. ` +
        `Use plain factual language. Output ONLY the description, no quotes or preamble. ` +
        `Content: ${truncated}`
      );
    default:
      throw new Error(`Unknown tone: ${tone}`);
  }
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

const TONES = ['editorial', 'engaging', 'neutral'];
const CSV_HEADER = [csvEscape('post_id'), csvEscape('title'), csvEscape('description')].join(',');

async function main() {
  // Fetch all 22 posts from WP REST API
  const ids = NEW_POST_IDS.join(',');
  const wpApiUrl = `https://nuvoicesprod.wpenginepowered.com/wp-json/wp/v2/posts?include=${ids}&per_page=${NEW_POST_IDS.length}`;

  console.log('Fetching posts from WordPress REST API...');
  const wpPosts = await fetchJSON(wpApiUrl);
  console.log(`Fetched ${wpPosts.length} posts\n`);

  const rows = { editorial: [], engaging: [], neutral: [] };
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
      for (const tone of TONES) {
        const prompt = buildPrompt(tone, title, strippedContent);
        const description = callClaude(prompt);
        rows[tone].push(csvRow(post.id, title, description));
      }
      successCount++;
      console.log(`[${successCount}/${wpPosts.length}] "${title}"`);
    } catch (err) {
      console.log(`Failed "${title}": ${err.message}`);
    }
  }

  // Write output files
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const tone of TONES) {
    const filePath = path.join(outputDir, `new-descriptions-${tone}.csv`);
    const content = [CSV_HEADER, ...rows[tone]].join('\n') + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Wrote ${filePath}`);
  }

  console.log(`\nDone: ${successCount} posts, ${TONES.length} tones each.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
