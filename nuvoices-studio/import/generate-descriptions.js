'use strict';

const WordPressParser = require('./parser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function csvEscape(val) {
  return '"' + String(val).replace(/"/g, '""') + '"';
}

function csvRow(postId, title, description) {
  return [csvEscape(postId), csvEscape(title), csvEscape(description)].join(',');
}

function buildPrompt(tone, title, content) {
  const truncated = content.slice(0, 2000);

  switch (tone) {
    case 'editorial':
      return (
        `Write a 1-2 sentence editorial description (max 280 characters) for a New Voices magazine post titled "${title}". ` +
        `Use third-person journalistic voice. Output ONLY the description, no quotes or preamble. ` +
        `Content: ${truncated}`
      );
    case 'engaging':
      return (
        `Write a 1-2 sentence engaging description (max 280 characters) for a New Voices magazine post titled "${title}". ` +
        `Use an inviting reader-facing voice that draws people in. Output ONLY the description, no quotes or preamble. ` +
        `Content: ${truncated}`
      );
    case 'neutral':
      return (
        `Write a 1-2 sentence neutral summary (max 280 characters) for a New Voices magazine post titled "${title}". ` +
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
  });
  return result.trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const TONES = ['editorial', 'engaging', 'neutral'];
const CSV_HEADER = [csvEscape('post_id'), csvEscape('title'), csvEscape('description')].join(',');

async function main() {
  const parser = new WordPressParser('./nuvoices.xml');
  await parser.parseXML();

  // getPosts() already filters to published posts only
  const posts = parser.getPosts();
  const total = posts.length;
  console.log(`Found ${total} published posts`);

  // Accumulate rows per tone
  const rows = {
    editorial: [],
    engaging: [],
    neutral: [],
  };

  let successCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const strippedContent = stripHtml(post.content);

    if (strippedContent.length < 50) {
      console.log(`⚠️  Skipping "${post.title}" — content too short`);
      continue;
    }

    let descriptions;
    try {
      descriptions = {};
      for (const tone of TONES) {
        const prompt = buildPrompt(tone, post.title, strippedContent);
        descriptions[tone] = callClaude(prompt);
      }
    } catch (err) {
      console.log(`❌ Failed "${post.title}": ${err.message}`);
      continue;
    }

    for (const tone of TONES) {
      rows[tone].push(csvRow(post.wpPostId, post.title, descriptions[tone]));
    }

    successCount++;
    console.log(`✓ [${successCount}/${total}] Generated: "${post.title}"`);
  }

  // Write output files
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const tone of TONES) {
    const filePath = path.join(outputDir, `descriptions-${tone}.csv`);
    const content = [CSV_HEADER, ...rows[tone]].join('\n') + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
  }

  console.log(`✅ Wrote ${successCount} descriptions to each CSV file in output/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
