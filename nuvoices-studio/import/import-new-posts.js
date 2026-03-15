/**
 * Import 22 new WordPress posts (published after the XML export date 2025-07-21)
 * into Sanity via the WP REST API.
 *
 * Usage:
 *   node import-new-posts.js            # dry run — preview only
 *   node import-new-posts.js --commit   # actually write to Sanity
 *   node import-new-posts.js --commit --skip-images
 */

const { createClient } = require('@sanity/client');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const ContentTransformer = require('./transformers');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ---------------------------------------------------------------------------
// 1. Hardcoded category assignments (confirmed from review)
// ---------------------------------------------------------------------------
const NEW_POSTS = [
  { wpId: 4419, category: 'podcast', subCategories: [] },
  { wpId: 4415, category: 'podcast', subCategories: [] },
  { wpId: 4411, category: 'podcast', subCategories: [] },
  { wpId: 4400, category: 'magazine', subCategories: ['profile'] },
  { wpId: 4397, category: 'magazine', subCategories: ['books'], featuredImageUrl: 'https://nuvoicesprod.wpenginepowered.com/wp-content/uploads/2026/01/Untitled-design-1-2048x1448.png' },
  { wpId: 4388, category: 'news', subCategories: [] },
  { wpId: 4386, category: 'podcast', subCategories: [] },
  { wpId: 4353, category: 'magazine', subCategories: ['books'] },
  { wpId: 4376, category: 'magazine', subCategories: ['analysis'] },
  { wpId: 4366, category: 'podcast', subCategories: [] },
  { wpId: 4362, category: 'news', subCategories: [] },
  { wpId: 4310, category: 'magazine', subCategories: ['books'] },
  { wpId: 4338, category: 'magazine', subCategories: ['film'] },
  { wpId: 4340, category: 'news', subCategories: [] },
  { wpId: 4334, category: 'podcast', subCategories: [] },
  { wpId: 4330, category: 'magazine', subCategories: ['analysis'] },
  { wpId: 4320, category: 'magazine', subCategories: ['profile'] },
  { wpId: 4312, category: 'podcast', subCategories: [] },
  { wpId: 4305, category: 'magazine', subCategories: ['film'] },
  { wpId: 4300, category: 'podcast', subCategories: [] },
  { wpId: 4297, category: 'magazine', subCategories: ['profile'] },
  { wpId: 4291, category: 'magazine', subCategories: ['analysis'] },
];

// ---------------------------------------------------------------------------
// 2. Sanity client — default to staging2, use --production to override
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes('--production')) {
  process.env.SANITY_STUDIO_DATASET = 'production';
  console.log('Warning: Using PRODUCTION dataset\n');
} else if (!process.env.SANITY_STUDIO_DATASET) {
  process.env.SANITY_STUDIO_DATASET = 'staging2';
}

if (!process.env.SANITY_STUDIO_PROJECT_ID) {
  throw new Error('Missing SANITY_STUDIO_PROJECT_ID env var');
}

const sanityClient = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2023-05-03',
});

// ---------------------------------------------------------------------------
// 3. HTTP helpers
// ---------------------------------------------------------------------------
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const transport = urlObj.protocol === 'https:' ? https : http;

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
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
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

// ---------------------------------------------------------------------------
// 4. Image helpers (copied from importPosts.js — not exported there)
// ---------------------------------------------------------------------------
function downloadImage(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attemptDownload = (attemptNumber) => {
      const urlObj = new URL(url);
      const transport = urlObj.protocol === 'https:' ? https : http;

      const request = transport.get(url, { timeout: 10000 }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            console.log(`  Following redirect to: ${redirectUrl}`);
            downloadImage(redirectUrl, retries).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          if (attemptNumber < retries) {
            console.log(`  Retry ${attemptNumber}/${retries} for image download...`);
            setTimeout(() => attemptDownload(attemptNumber + 1), 1000 * attemptNumber);
            return;
          }
          reject(new Error(`Failed to download image after ${retries} attempts: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', (err) => {
          if (attemptNumber < retries) {
            console.log(`  Retry ${attemptNumber}/${retries} after error: ${err.message}`);
            setTimeout(() => attemptDownload(attemptNumber + 1), 1000 * attemptNumber);
          } else {
            reject(err);
          }
        });
      });

      request.on('error', (err) => {
        if (attemptNumber < retries) {
          console.log(`  Retry ${attemptNumber}/${retries} after request error: ${err.message}`);
          setTimeout(() => attemptDownload(attemptNumber + 1), 1000 * attemptNumber);
        } else {
          reject(err);
        }
      });

      request.on('timeout', () => {
        request.destroy();
        if (attemptNumber < retries) {
          console.log(`  Retry ${attemptNumber}/${retries} after timeout`);
          setTimeout(() => attemptDownload(attemptNumber + 1), 1000 * attemptNumber);
        } else {
          reject(new Error('Request timeout'));
        }
      });
    };

    attemptDownload(1);
  });
}

function extractImageUrls(html) {
  const imageUrls = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    imageUrls.push(match[1]);
  }
  return imageUrls;
}

async function findExistingAsset(client, imageUrl, cache) {
  try {
    if (cache && cache.has(imageUrl)) {
      console.log(`  Using cached asset for: ${imageUrl}`);
      return cache.get(imageUrl);
    }

    const query = '*[_type == "sanity.imageAsset" && source.url == $url][0]';
    const existingAsset = await client.fetch(query, { url: imageUrl });
    if (existingAsset) {
      console.log(`  Found existing asset for: ${imageUrl}`);
      if (cache) cache.set(imageUrl, existingAsset._id);
      return existingAsset._id;
    }

    const filename = imageUrl.split('/').pop();
    const filenameQuery = '*[_type == "sanity.imageAsset" && originalFilename == $filename][0]';
    const assetByFilename = await client.fetch(filenameQuery, { filename });
    if (assetByFilename) {
      console.log(`  Found existing asset by filename: ${filename}`);
      if (cache) cache.set(imageUrl, assetByFilename._id);
      return assetByFilename._id;
    }

    return null;
  } catch (error) {
    console.error(`  Error checking for existing asset:`, error.message);
    return null;
  }
}

async function uploadImageToSanity(client, imageUrl, postTitle, cache) {
  try {
    const existingAssetId = await findExistingAsset(client, imageUrl, cache);
    if (existingAssetId) return existingAssetId;

    let imageBuffer;
    let successfulUrl = imageUrl;

    try {
      console.log(`  Downloading image: ${imageUrl}`);
      imageBuffer = await downloadImage(imageUrl);
    } catch (error) {
      if (imageUrl.includes('li1584-232.members.linode.com')) {
        const wpEngineUrl = imageUrl.replace(
          'http://li1584-232.members.linode.com',
          'https://nuvoicesprod.wpenginepowered.com'
        );
        console.log(`  Retrying with WP Engine URL: ${wpEngineUrl}`);
        try {
          imageBuffer = await downloadImage(wpEngineUrl);
          successfulUrl = wpEngineUrl;
        } catch (wpEngineError) {
          console.error(`  Failed to download from WP Engine: ${wpEngineError.message}`);
          throw error;
        }
      } else {
        throw error;
      }
    }

    const urlParts = successfulUrl.split('/');
    const filename = urlParts[urlParts.length - 1] || 'image.jpg';

    console.log(`  Uploading new image to Sanity: ${filename}`);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename,
      source: {
        name: 'wordpress-import',
        id: successfulUrl,
        url: successfulUrl,
      },
    });

    if (cache) cache.set(imageUrl, asset._id);
    return asset._id;
  } catch (error) {
    console.error(`  Failed to upload image ${imageUrl}:`, error.message);
    return null;
  }
}

async function processImagesInContent(client, html, postTitle, globalCache) {
  if (!html) return { processedHtml: html, imageAssetMap: new Map() };

  // Replace old Linode URLs
  let processedHtml = html.replace(
    /http:\/\/li1584-232\.members\.linode\.com/g,
    'https://nuvoicesprod.wpenginepowered.com'
  );

  const imageUrls = extractImageUrls(processedHtml);
  const imageAssetMap = new Map();

  if (imageUrls.length > 0) {
    console.log(`  Processing ${imageUrls.length} images for post "${postTitle}"`);

    for (const imageUrl of imageUrls) {
      if (!imageAssetMap.has(imageUrl)) {
        try {
          const assetId = await uploadImageToSanity(client, imageUrl, postTitle, globalCache);
          if (assetId) {
            imageAssetMap.set(imageUrl, assetId);
          } else {
            console.warn(`  Skipping image that couldn't be uploaded: ${imageUrl}`);
            processedHtml = processedHtml.replace(
              new RegExp(`<img[^>]*src=["']${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'),
              ''
            );
          }
        } catch (error) {
          console.error(`  Error processing image ${imageUrl}: ${error.message}`);
          processedHtml = processedHtml.replace(
            new RegExp(`<img[^>]*src=["']${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'),
            ''
          );
        }
      }
    }
  }

  return { processedHtml, imageAssetMap };
}

// ---------------------------------------------------------------------------
// 5. Main import function
// ---------------------------------------------------------------------------
async function importNewPosts(options = {}) {
  const { commit = false, skipImages = false } = options;

  console.log(`\n=== Import New WordPress Posts ===`);
  console.log(`Dataset: ${process.env.SANITY_STUDIO_DATASET}`);
  console.log(`Mode: ${commit ? 'COMMIT (writing to Sanity)' : 'DRY RUN (preview only)'}`);
  console.log(`Posts: ${NEW_POSTS.length}`);
  console.log(`Skip images: ${skipImages}\n`);

  // Fetch all 22 posts from WP REST API in one request
  const ids = NEW_POSTS.map((p) => p.wpId).join(',');
  const wpApiUrl = `https://nuvoicesprod.wpenginepowered.com/wp-json/wp/v2/posts?include=${ids}&per_page=${NEW_POSTS.length}&_embed`;

  console.log('Fetching posts from WordPress REST API...');
  const wpPosts = await fetchJSON(wpApiUrl);
  console.log(`Fetched ${wpPosts.length} posts from WP API\n`);

  if (wpPosts.length !== NEW_POSTS.length) {
    const fetchedIds = new Set(wpPosts.map((p) => p.id));
    const missing = NEW_POSTS.filter((p) => !fetchedIds.has(p.wpId));
    console.warn(`WARNING: Missing ${missing.length} posts: ${missing.map((p) => p.wpId).join(', ')}`);
  }

  // Build lookup map from config
  const configMap = new Map();
  for (const entry of NEW_POSTS) {
    configMap.set(entry.wpId, entry);
  }

  // Fetch Sanity lookup data
  const [authors, categories, tags] = await Promise.all([
    sanityClient.fetch('*[_type == "author"]{ _id, wpAuthorId, name, "slug": slug.current }'),
    sanityClient.fetch('*[_type == "category" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, title }'),
    sanityClient.fetch('*[_type == "tag"]{ _id, wpNicename, title }'),
  ]);

  // Category slug -> Sanity _id
  const categoryMap = new Map();
  for (const cat of categories) {
    if (cat.slug) categoryMap.set(cat.slug, cat._id);
  }

  // Tag nicename -> Sanity _id
  const tagMap = new Map();
  for (const tag of tags) {
    if (tag.wpNicename) tagMap.set(tag.wpNicename, tag._id);
  }

  // Author slug -> Sanity _id
  const authorSlugMap = new Map();
  for (const author of authors) {
    if (author.slug) authorSlugMap.set(author.slug, author._id);
  }

  console.log(`Sanity lookups: ${authors.length} authors, ${categories.length} categories, ${tags.length} tags\n`);

  const globalImageAssetCache = new Map();
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const wpPost of wpPosts) {
    const config = configMap.get(wpPost.id);
    if (!config) {
      console.warn(`No config for WP post ID ${wpPost.id}, skipping`);
      skippedCount++;
      continue;
    }

    try {
      // Decode title
      const title = decodeHtmlEntities(wpPost.title.rendered);
      const slug = wpPost.slug;
      const publishedAt = new Date(wpPost.date_gmt + 'Z').toISOString();

      // Excerpt (strip HTML)
      const excerpt = ContentTransformer.cleanExcerpt(wpPost.excerpt.rendered);

      // Author — match via _embedded author slug
      const wpAuthor = wpPost._embedded && wpPost._embedded.author && wpPost._embedded.author[0];
      const authorSlug = wpAuthor ? wpAuthor.slug : null;
      const authorId = authorSlug ? authorSlugMap.get(authorSlug) : null;
      if (!authorId) {
        console.warn(`  No Sanity author for slug "${authorSlug}" (post "${title}"), using first author`);
      }
      const finalAuthorId = authorId || authors[0]._id;

      // Tags — from _embedded wp:term (taxonomy index 1 = post_tag)
      const wpTerms = (wpPost._embedded && wpPost._embedded['wp:term']) || [];
      const wpTags = wpTerms.flat().filter((t) => t.taxonomy === 'post_tag');
      const tagRefs = [];
      for (const wpTag of wpTags) {
        const tagId = tagMap.get(wpTag.slug);
        if (tagId) {
          tagRefs.push({
            _key: ContentTransformer.generateKey(),
            _type: 'reference',
            _ref: tagId,
          });
        } else {
          console.warn(`  Tag "${wpTag.slug}" not found in Sanity, skipping`);
        }
      }

      // Categories — from hardcoded config
      const categoryRefs = [];
      const primaryCatId = categoryMap.get(config.category);
      if (primaryCatId) {
        categoryRefs.push({
          _key: ContentTransformer.generateKey(),
          _type: 'reference',
          _ref: primaryCatId,
        });
      } else {
        console.warn(`  Primary category "${config.category}" not found in Sanity`);
      }
      for (const sub of config.subCategories) {
        const subId = categoryMap.get(sub);
        if (subId) {
          categoryRefs.push({
            _key: ContentTransformer.generateKey(),
            _type: 'reference',
            _ref: subId,
          });
        } else {
          console.warn(`  Sub-category "${sub}" not found in Sanity`);
        }
      }

      // Featured image — from _embedded wp:featuredmedia, or hardcoded fallback
      let featuredImageAsset = null;
      const wpFeaturedMedia =
        wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0];
      let featuredUrl = null;
      if (wpFeaturedMedia && wpFeaturedMedia.source_url) {
        featuredUrl = wpFeaturedMedia.source_url.replace(
          /https?:\/\/(www\.)?nuvoices\.com/g,
          'https://nuvoicesprod.wpenginepowered.com'
        );
      } else if (config.featuredImageUrl) {
        featuredUrl = config.featuredImageUrl;
        console.log(`  Using hardcoded featured image for wp:${wpPost.id}`);
      }
      if (featuredUrl) {
        if (!skipImages && commit) {
          const assetId = await uploadImageToSanity(sanityClient, featuredUrl, title, globalImageAssetCache);
          if (assetId) {
            featuredImageAsset = {
              _type: 'image',
              asset: { _type: 'reference', _ref: assetId },
            };
          }
        } else {
          console.log(`  Featured image: ${featuredUrl}`);
        }
      }

      // Content — replace nuvoices.com URLs, process inline images, convert to Portable Text
      let content = wpPost.content.rendered || '';
      content = content.replace(
        /https?:\/\/(www\.)?nuvoices\.com/g,
        'https://nuvoicesprod.wpenginepowered.com'
      );

      let imageAssetMap = new Map();
      if (!skipImages && commit) {
        const result = await processImagesInContent(sanityClient, content, title, globalImageAssetCache);
        content = result.processedHtml;
        imageAssetMap = result.imageAssetMap;
      }

      const portableTextBody = ContentTransformer.htmlToPortableText(content, imageAssetMap);

      // Build the post document
      const postDoc = {
        _type: 'post',
        _id: `post-wp-${wpPost.id}`,
        title,
        slug: { _type: 'slug', current: slug },
        author: { _type: 'reference', _ref: finalAuthorId },
        publishedAt,
        excerpt,
        body: portableTextBody,
        categories: categoryRefs,
        tags: tagRefs,
        status: 'published',
        wpPostId: wpPost.id,
        wpPostName: slug,
        ...(featuredImageAsset && { featuredImage: featuredImageAsset }),
        seo: {
          metaTitle: title.length <= 60 ? title : title.substring(0, 57) + '...',
          metaDescription: excerpt.substring(0, 160),
        },
      };

      if (commit) {
        const publishedId = postDoc._id;
        await sanityClient
          .transaction()
          .createOrReplace(postDoc)
          .delete(`drafts.${publishedId}`)
          .commit({ autoGenerateArrayKeys: true });

        console.log(`  IMPORTED: "${title}" (wp:${wpPost.id}) -> ${postDoc._id}`);
      } else {
        console.log(`  [DRY RUN] "${title}" (wp:${wpPost.id})`);
        console.log(`    slug: ${slug}`);
        console.log(`    category: ${config.category}${config.subCategories.length ? ' + ' + config.subCategories.join(', ') : ''}`);
        console.log(`    author: ${authorSlug || 'fallback'}`);
        console.log(`    tags: ${wpTags.map((t) => t.slug).join(', ') || 'none'}`);
        console.log(`    featured image: ${wpFeaturedMedia ? 'yes' : 'no'}`);
        console.log(`    body blocks: ${portableTextBody.length}`);
      }

      importedCount++;

      // Rate-limit delay when committing
      if (commit) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`  ERROR on WP post ${wpPost.id}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`${commit ? 'Imported' : 'Previewed'}: ${importedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);

  return { importedCount, skippedCount, errorCount };
}

// ---------------------------------------------------------------------------
// 6. CLI
// ---------------------------------------------------------------------------
if (require.main === module) {
  const commit = args.includes('--commit');
  const skipImages = args.includes('--skip-images');

  importNewPosts({ commit, skipImages })
    .then((result) => {
      if (result.errorCount > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = importNewPosts;
