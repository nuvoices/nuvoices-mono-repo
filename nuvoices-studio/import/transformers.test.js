const ContentTransformer = require('./transformers');
const fs = require('fs');
const path = require('path');

describe('preprocessBuzzsproutScripts', () => {
  test('converts div + script pattern to wp-embed-placeholder with player params', () => {
    const html = `<div id="buzzsprout-player-9242127"></div><script src="https://www.buzzsprout.com/1858406/9242127-a-rocket-maker-turned-journalist-lijia-zhang.js?container_id=buzzsprout-player-9242127&player=small" type="text/javascript" charset="utf-8"></script>`;

    const result = ContentTransformer.preprocessBuzzsproutScripts(html);

    expect(result).toBe('<div class="wp-embed-placeholder" data-url="https://www.buzzsprout.com/1858406/9242127?client_source=small_player&iframe=true"></div>');
  });

  test('handles HTML-encoded ampersands in script src', () => {
    const html = `<div id="buzzsprout-player-9242126"></div><script src="https://www.buzzsprout.com/1858406/9242126-eleanor-goodman-on-the-art-of-translating-chinese-poetry.js?container_id=buzzsprout-player-9242126&amp;player=small" type="text/javascript" charset="utf-8"></script>`;

    const result = ContentTransformer.preprocessBuzzsproutScripts(html);

    expect(result).toBe('<div class="wp-embed-placeholder" data-url="https://www.buzzsprout.com/1858406/9242126?client_source=small_player&iframe=true"></div>');
  });

  test('handles script without preceding div container', () => {
    const html = `<script src="https://www.buzzsprout.com/1858406/9242127-title.js?container_id=buzzsprout-player-9242127&player=small" type="text/javascript" charset="utf-8"></script>`;

    const result = ContentTransformer.preprocessBuzzsproutScripts(html);

    expect(result).toBe('<div class="wp-embed-placeholder" data-url="https://www.buzzsprout.com/1858406/9242127?client_source=small_player&iframe=true"></div>');
  });

  test('handles whitespace between div and script', () => {
    const html = `<div id="buzzsprout-player-9242127"></div>
    <script src="https://www.buzzsprout.com/1858406/9242127-title.js?container_id=buzzsprout-player-9242127&player=small" type="text/javascript" charset="utf-8"></script>`;

    const result = ContentTransformer.preprocessBuzzsproutScripts(html);

    expect(result).toBe('<div class="wp-embed-placeholder" data-url="https://www.buzzsprout.com/1858406/9242127?client_source=small_player&iframe=true"></div>');
  });

  test('preserves surrounding content', () => {
    const html = `<p>Before</p><div id="buzzsprout-player-9242127"></div><script src="https://www.buzzsprout.com/1858406/9242127-title.js?container_id=buzzsprout-player-9242127&player=small" type="text/javascript" charset="utf-8"></script><p>After</p>`;

    const result = ContentTransformer.preprocessBuzzsproutScripts(html);

    expect(result).toBe('<p>Before</p><div class="wp-embed-placeholder" data-url="https://www.buzzsprout.com/1858406/9242127?client_source=small_player&iframe=true"></div><p>After</p>');
  });

  test('handles multiple embeds in same content', () => {
    const html = `<div id="buzzsprout-player-111"></div><script src="https://www.buzzsprout.com/1858406/111-first.js?container_id=buzzsprout-player-111&player=small" type="text/javascript" charset="utf-8"></script>
<p>Some text</p>
<div id="buzzsprout-player-222"></div><script src="https://www.buzzsprout.com/1858406/222-second.js?container_id=buzzsprout-player-222&player=small" type="text/javascript" charset="utf-8"></script>`;

    const result = ContentTransformer.preprocessBuzzsproutScripts(html);

    expect(result).toContain('data-url="https://www.buzzsprout.com/1858406/111?client_source=small_player&iframe=true"');
    expect(result).toContain('data-url="https://www.buzzsprout.com/1858406/222?client_source=small_player&iframe=true"');
    expect(result).toContain('<p>Some text</p>');
    expect(result).not.toContain('<script');
  });

  test('handles /episodes/ URL format', () => {
    const html = `<div id="buzzsprout-player-17378632"></div><script src="https://www.buzzsprout.com/1858406/episodes/17378632-on-trump-2-0-and-beijing-s-new-tactics-with-amanda-hsiao.js?container_id=buzzsprout-player-17378632&player=small" type="text/javascript" charset="utf-8"></script>`;

    const result = ContentTransformer.preprocessBuzzsproutScripts(html);

    expect(result).toBe('<div class="wp-embed-placeholder" data-url="https://www.buzzsprout.com/1858406/17378632?client_source=small_player&iframe=true"></div>');
  });

  test('returns null/undefined input unchanged', () => {
    expect(ContentTransformer.preprocessBuzzsproutScripts(null)).toBe(null);
    expect(ContentTransformer.preprocessBuzzsproutScripts(undefined)).toBe(undefined);
    expect(ContentTransformer.preprocessBuzzsproutScripts('')).toBe('');
  });
});

describe('htmlToPortableText with Buzzsprout embeds', () => {
  test('creates embed block from Buzzsprout script embed with player params', () => {
    const html = `<div id="buzzsprout-player-9242127"></div><script src="https://www.buzzsprout.com/1858406/9242127-title.js?container_id=buzzsprout-player-9242127&player=small" type="text/javascript" charset="utf-8"></script>`;

    const blocks = ContentTransformer.htmlToPortableText(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]._type).toBe('embed');
    expect(blocks[0].platform).toBe('buzzsprout');
    expect(blocks[0].url).toBe('https://www.buzzsprout.com/1858406/9242127?client_source=small_player&iframe=true');
    expect(blocks[0].embedId).toBe('1858406/9242127');
  });

  test('handles mixed content with Buzzsprout embed', () => {
    const html = `<p>Listen to the podcast:</p>
<div id="buzzsprout-player-9242127"></div><script src="https://www.buzzsprout.com/1858406/9242127-title.js?container_id=buzzsprout-player-9242127&player=small" type="text/javascript" charset="utf-8"></script>
<p>Thanks for listening!</p>`;

    const blocks = ContentTransformer.htmlToPortableText(html);

    // Should have 3 blocks: paragraph, embed, paragraph
    expect(blocks).toHaveLength(3);
    expect(blocks[0]._type).toBe('block');
    expect(blocks[0].children[0].text).toContain('Listen to the podcast');
    expect(blocks[1]._type).toBe('embed');
    expect(blocks[1].platform).toBe('buzzsprout');
    expect(blocks[1].url).toBe('https://www.buzzsprout.com/1858406/9242127?client_source=small_player&iframe=true');
    expect(blocks[2]._type).toBe('block');
    expect(blocks[2].children[0].text).toContain('Thanks for listening');
  });
});

describe('WordPress XML Buzzsprout embed detection', () => {
  let xmlContent;

  beforeAll(() => {
    const xmlPath = path.join(__dirname, 'nuvoices.xml');
    xmlContent = fs.readFileSync(xmlPath, 'utf-8');
  });

  test('preprocessBuzzsproutScripts matches all script-based embeds in XML', () => {
    // Count script-based Buzzsprout embeds in original XML (both formats)
    // Format 1: buzzsprout.com/SHOW_ID/EPISODE_ID
    // Format 2: buzzsprout.com/SHOW_ID/episodes/EPISODE_ID
    const scriptPattern = /<script[^>]*src=["']https?:\/\/(?:www\.)?buzzsprout\.com\/\d+\/(?:episodes\/)?\d+[^"']*["'][^>]*>/gi;
    const originalScriptMatches = xmlContent.match(scriptPattern) || [];

    // Apply preprocessor
    const processedHtml = ContentTransformer.preprocessBuzzsproutScripts(xmlContent);

    // Count remaining script-based embeds after preprocessing
    const remainingScriptMatches = processedHtml.match(scriptPattern) || [];

    // Count new wp-embed-placeholder divs created (with player params)
    const placeholderPattern = /<div class="wp-embed-placeholder" data-url="https:\/\/www\.buzzsprout\.com\/\d+\/\d+\?client_source=small_player&iframe=true">/gi;
    const placeholderMatches = processedHtml.match(placeholderPattern) || [];

    console.log(`Original Buzzsprout script embeds: ${originalScriptMatches.length}`);
    console.log(`Converted to placeholders: ${placeholderMatches.length}`);
    console.log(`Remaining script embeds: ${remainingScriptMatches.length}`);

    // All script-based embeds should be converted
    expect(remainingScriptMatches.length).toBe(0);
    expect(placeholderMatches.length).toBe(originalScriptMatches.length);
  });

  test('extracts unique Buzzsprout episode IDs', () => {
    // Find all unique Buzzsprout show/episode ID pairs in the XML
    const buzzsproutPattern = /buzzsprout\.com\/(\d+)\/(\d+)/gi;
    const matches = [...xmlContent.matchAll(buzzsproutPattern)];

    const uniqueEmbeds = new Set();
    matches.forEach(match => {
      uniqueEmbeds.add(`${match[1]}/${match[2]}`);
    });

    console.log(`Unique Buzzsprout embeds found: ${uniqueEmbeds.size}`);
    console.log('Embed IDs:', Array.from(uniqueEmbeds).sort());

    // Should find at least some unique embeds
    expect(uniqueEmbeds.size).toBeGreaterThan(0);
  });
});
