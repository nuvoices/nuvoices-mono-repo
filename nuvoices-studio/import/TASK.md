# Embed Type Verification Task

This document tracks the verification of all embed types processed during the WordPress to Sanity migration.

## Goal
Verify that each embed type from the WordPress XML is properly converted to Sanity embed blocks.

## Embed Types to Verify

### 1. Buzzsprout (Podcast)
- [x] Find example in nuvoices.xml
- [x] Verify conversion in Sanity - ✅ WORKING
- **Example Location**: Line 47595
- **Post ID**: 3650
- **Post Title**: "NüVoices Podcast #85: Becoming a Stand-up Comedian with He Huang"
- **Post URL**: https://nuvoices.com/nuvoices-podcast-85-becoming-a-stand-up-comedian-with-he-huang/
- **Post Slug**: `nuvoices-podcast-85-becoming-a-stand-up-comedian-with-he-huang`
- **Example URL**: `https://www.buzzsprout.com/1858406/11704268-becoming-a-stand-up-comedian-with-he-huang`
- **Pattern**: `buzzsprout.com/{SHOW_ID}/{EPISODE_ID}`
- **Expected embedId**: `1858406/11704268`

### 2. YouTube (Video)
- [x] Find example in nuvoices.xml
- [x] Verify conversion in Sanity - ✅ WORKING
- **Example Location**: Line 52532
- **Post ID**: 931
- **Post Title**: "100+ attend NüVoices NYC launch and discussion on Chinese feminism"
- **Post URL**: https://nuvoices.com/2018/11/18/100-attend-nuvoices-nyc-launch-and-discussion-on-chinese-feminism/
- **Post Slug**: `100-attend-nuvoices-nyc-launch-and-discussion-on-chinese-feminism`
- **Example URL**: `https://www.youtube.com/embed/-Ebs6lcjP4k`
- **Pattern**: `youtube.com/embed/{VIDEO_ID}`
- **Expected embedId**: `-Ebs6lcjP4k`

### 3. Vimeo (Video)
- [x] Find example in nuvoices.xml
- [x] Verify conversion in Sanity - ✅ WORKING
- **Example Location**: Line 54810 (in post meta), plain URLs in content
- **Post ID**: 1365
- **Post Title**: "Carving Out Chinese Ideals of Female Beauty: Visualizations by Artist Su Yang"
- **Post URL**: https://nuvoices.com/carving-out-chinese-ideals-of-female-beauty-visualizations-by-artist-su-yang/
- **Post Slug**: `carving-out-chinese-ideals-of-female-beauty-visualizations-by-artist-su-yang`
- **Example URL**: `https://player.vimeo.com/video/219341975`
- **Pattern**: `player.vimeo.com/video/{VIDEO_ID}` or `vimeo.com/{VIDEO_ID}`
- **Expected embedId**: `219341975`
- **Content Format**: WordPress stores as `[embed]https://vimeo.com/219341975[/embed]` and plain URLs `https://vimeo.com/225240778`
- **Note**: ✅ Updated transformer to handle WordPress shortcodes `[embed]...[/embed]` and plain embed URLs. Import detected 3+ Vimeo embeds successfully!

### 4. Art19 (Podcast)
- [x] Find example in nuvoices.xml
- [x] Verify conversion in Sanity - ⚠️ NOT WORKING
- **Example Location**: Plain URLs in Gutenberg blocks
- **Post ID**: Multiple posts with Art19 embeds
- **Post Title**: "NüVoices Podcast #29: Gender, self-discovery, and vibe curation with Mengwen Cao"
- **Post URL**: https://nuvoices.com/nuvoices-podcast-gender-self-discovery-and-vibe-curation-with-mengwen-cao/
- **Example URL**: `https://art19.com/shows/nuvoices/episodes/0f4ec6d8-dc1c-4666-aa12-7b36dc0e496c`
- **Pattern**: `art19.com/shows/{SHOW}/episodes/{EPISODE_ID}` (without /embed)
- **Expected embedId**: Episode ID extracted from URL
- **Content Format**: WordPress Gutenberg block: `<figure class="wp-block-embed-wordpress"><div class="wp-block-embed__wrapper">URL</div></figure>`
- **Note**: ⚠️ Updated transformer to detect plain Art19 URLs, but JSDOM parsing of text content inside divs may be preventing detection. Import completed with 0 Art19 embeds found. May require different parsing approach.

### 5. Acast (Podcast)
- [x] Find example in nuvoices.xml
- [x] Verify conversion in Sanity - ✅ WORKING
- **Example Location**: Line 70700
- **Post ID**: 3644
- **Post Title**: "NüVoices Podcast #84: A Conversation with Sue-Lin Wong on 'The Prince' Podcast & China's 20th Party Congress"
- **Post URL**: https://nuvoices.com/2022/11/02/nuvoices-podcast-84-a-conversation-with-sue-lin-wong-on-the-prince-podcast-chinas-20th-party-congress/
- **Post Slug**: `nuvoices-podcast-84-a-conversation-with-sue-lin-wong-on-the-prince-podcast-chinas-20th-party-congress`
- **Example URL**: `https://embed.acast.com/62cff2d9d455860013698a7f/63336987363b44001270c488`
- **Pattern**: `embed.acast.com/{SHOW_ID}/{EPISODE_ID}`
- **Expected embedId**: `62cff2d9d455860013698a7f/63336987363b44001270c488`

### 6. Amazon Kindle (Book)
- [x] Find example in nuvoices.xml
- [x] Verify conversion in Sanity - ⚠️ NOT IMPORTED
- **Example Location**: Line 64505 (in post meta)
- **Post ID**: 3016
- **Post Title**: "Amy Sommers on Her Debut Historical Novel, 'Rumors from Shanghai'"
- **Post URL**: https://nuvoices.com/amy-sommers-on-her-debut-historical-novel-rumors-from-shanghai/
- **Post Slug**: `amy-sommers-on-her-debut-historical-novel-rumors-from-shanghai`
- **Example URL**: `https://read.amazon.com/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_D8pElGjMmpgJeo&asin=B087JZTFJ2&tag=kpembed-20`
- **Pattern**: `read.amazon.com/kp/card?...&asin={ASIN}`
- **Expected embedId**: `B087JZTFJ2`
- **Note**: ⚠️ Only 1 Amazon Kindle embed found, and it's in WordPress post meta (oembed cache), not in main content. Import script only processes `content:encoded` field. Code supports Amazon, but no content to import.

## Verification Process

For each embed type:
1. Identify which post contains the embed in nuvoices.xml
2. Find the post title and slug
3. Check if the post exists in Sanity
4. Verify the embed block has correct structure:
   - `_type: 'embed'`
   - `platform: '{platform_name}'`
   - `embedId: '{expected_id}'`
   - `url: '{original_url}'`
   - `caption`: (optional, from iframe title attribute)

## Summary

### ✅ Working Embeds (4/6)
1. **Buzzsprout** - Found in content as iframe tags, imported successfully
2. **YouTube** - Found in content as iframe tags AND plain URLs (`youtube.com/watch?v=`), imported successfully
3. **Vimeo** - Found in content as `[embed]` shortcodes and plain URLs, NOW WORKING after transformer update
4. **Acast** - Found in content as iframe tags, imported successfully

### ⚠️ Not Working/Not in Content (2/6)
5. **Art19** - Found as plain URLs in Gutenberg blocks. URLs are inside text nodes of divs, which JSDOM may not process correctly with current regex approach. 0 embeds detected in import. Needs alternative parsing strategy.
6. **Amazon Kindle** - Only found in WordPress post meta (oembed cache), not in main content. Import script only processes `content:encoded` field. Code supports Amazon, but no content to import.

### Technical Notes
- All embed types are handled in `transformers.js:23-98` (extractEmbedData method)
- WordPress embed preprocessing in `transformers.js:111-127` (preprocessEmbeds method)
- Conversion happens in `transformers.js:204-346` (convertElementToBlock method)
- Called from `importPosts.js:368` via `ContentTransformer.htmlToPortableText()`
- Import script processes `<content:encoded>` field including iframes, shortcodes, and plain URLs
- Transformer now handles: iframes, `[embed]URL[/embed]` shortcodes, and standalone embed URLs
