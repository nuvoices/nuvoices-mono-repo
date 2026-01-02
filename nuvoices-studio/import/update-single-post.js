const { createClient } = require('@sanity/client');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const WordPressParser = require('./parser');
const ContentTransformer = require('./transformers');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Handle --production flag to override dataset
if (process.argv.includes('--production')) {
  process.env.SANITY_STUDIO_DATASET = 'production';
  console.log('⚠️  Using PRODUCTION dataset\n');
}

if (!process.env.SANITY_STUDIO_PROJECT_ID || !process.env.SANITY_STUDIO_DATASET) {
  throw new Error('Missing Sanity Studio project ID or dataset environment variables');
}

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2023-05-03'
});

// Helper function to download image from URL with retry logic
function downloadImage(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attemptDownload = (attemptNumber) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const request = client.get(url, { timeout: 10000 }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirects
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

// Helper function to extract image URLs from HTML content
function extractImageUrls(html) {
  const imageUrls = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    imageUrls.push(match[1]);
  }

  return imageUrls;
}

// Helper function to check if image already exists in Sanity
async function findExistingAsset(client, imageUrl, cache) {
  try {
    // Check cache first
    if (cache && cache.has(imageUrl)) {
      console.log(`  Using cached asset for: ${imageUrl}`);
      return cache.get(imageUrl);
    }

    // Check by source URL first (most reliable)
    const query = '*[_type == "sanity.imageAsset" && source.url == $url][0]';
    const existingAsset = await client.fetch(query, { url: imageUrl });

    if (existingAsset) {
      console.log(`  Found existing asset for: ${imageUrl}`);
      if (cache) cache.set(imageUrl, existingAsset._id);
      return existingAsset._id;
    }

    // Fallback: check by filename
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

// Helper function to upload image to Sanity and return asset reference
async function uploadImageToSanity(client, imageUrl, postTitle, cache) {
  try {
    // First check if image already exists
    const existingAssetId = await findExistingAsset(client, imageUrl, cache);
    if (existingAssetId) {
      return existingAssetId;
    }

    // Try to download from original URL first
    let imageBuffer;
    let successfulUrl = imageUrl;

    try {
      console.log(`  Downloading image: ${imageUrl}`);
      imageBuffer = await downloadImage(imageUrl);
    } catch (error) {
      // If download fails and it's from the old Linode server, try WP Engine URL
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
          throw error; // Throw original error if both fail
        }
      } else {
        throw error;
      }
    }

    // Extract filename from URL
    const urlParts = successfulUrl.split('/');
    const filename = urlParts[urlParts.length - 1] || 'image.jpg';

    console.log(`  Uploading new image to Sanity: ${filename}`);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename,
      source: {
        name: 'wordpress-import',
        id: successfulUrl,  // Use URL as the sourceId
        url: successfulUrl
      }
    });

    // Cache the new asset
    if (cache) cache.set(imageUrl, asset._id);

    return asset._id;
  } catch (error) {
    console.error(`  Failed to upload image ${imageUrl}:`, error.message);
    if (error.response && error.response.body) {
      console.error(`  Error details:`, JSON.stringify(error.response.body, null, 2));
    }
    return null;
  }
}

// Helper function to extract gallery image IDs from WordPress gallery shortcodes
function extractGalleryImageIds(html) {
  if (!html) return [];

  const galleryPattern = /\[gallery\s+([^\]]+)\]/gi;
  const imageIds = [];
  let match;

  while ((match = galleryPattern.exec(html)) !== null) {
    const attributes = match[1];
    const idsMatch = attributes.match(/ids=["']([^"']+)["']/i);
    if (idsMatch) {
      const ids = idsMatch[1].split(',').map(id => parseInt(id.trim(), 10));
      imageIds.push(...ids);
    }
  }

  return imageIds;
}

// Helper function to replace image URLs in content with Sanity references
async function processImagesInContent(client, html, postTitle, globalCache, attachmentMap = new Map()) {
  if (!html) return { processedHtml: html, imageAssetMap: new Map() };

  // First, replace all old Linode URLs with WP Engine URLs in the HTML
  let processedHtml = html.replace(
    /http:\/\/li1584-232\.members\.linode\.com/g,
    'https://nuvoicesprod.wpenginepowered.com'
  );

  const imageAssetMap = new Map();

  // Extract and upload gallery images FIRST
  const galleryImageIds = extractGalleryImageIds(processedHtml);
  if (galleryImageIds.length > 0) {
    console.log(`  Found ${galleryImageIds.length} gallery images to process`);

    for (const imageId of galleryImageIds) {
      const attachment = attachmentMap.get(imageId);
      if (attachment && attachment.url) {
        // Normalize the URL
        const normalizedUrl = attachment.url.replace(
          'http://li1584-232.members.linode.com',
          'https://nuvoicesprod.wpenginepowered.com'
        );

        if (!imageAssetMap.has(normalizedUrl)) {
          try {
            console.log(`  Processing gallery image ID ${imageId}: ${normalizedUrl}`);
            const assetId = await uploadImageToSanity(client, normalizedUrl, postTitle, globalCache);
            if (assetId) {
              imageAssetMap.set(normalizedUrl, assetId);
              // Also map the original URL if different
              if (attachment.url !== normalizedUrl) {
                imageAssetMap.set(attachment.url, assetId);
              }
            } else {
              console.warn(`  Failed to upload gallery image ID ${imageId}`);
            }
          } catch (error) {
            console.error(`  Error processing gallery image ID ${imageId}: ${error.message}`);
          }
        }
      } else {
        console.warn(`  Gallery image ID ${imageId} not found in attachments`);
      }
    }
  }

  // Now extract and process regular images from HTML
  const imageUrls = extractImageUrls(processedHtml);
  if (imageUrls.length > 0) {
    console.log(`  Processing ${imageUrls.length} inline images for post "${postTitle}"`);

    for (const imageUrl of imageUrls) {
      if (!imageAssetMap.has(imageUrl)) {
        try {
          const assetId = await uploadImageToSanity(client, imageUrl, postTitle, globalCache);
          if (assetId) {
            imageAssetMap.set(imageUrl, assetId);
          } else {
            console.warn(`  Skipping image that couldn't be uploaded: ${imageUrl}`);
            // Remove the image from HTML to prevent broken references
            processedHtml = processedHtml.replace(new RegExp(`<img[^>]*src=["']${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'), '');
          }
        } catch (error) {
          console.error(`  Error processing image ${imageUrl}: ${error.message}`);
          // Remove the image from HTML to prevent broken references
          processedHtml = processedHtml.replace(new RegExp(`<img[^>]*src=["']${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'), '');
        }
      }
    }
  }

  return { processedHtml, imageAssetMap };
}

/**
 * Update a single post by WordPress post ID or slug
 * @param {number|string} identifier - WordPress post ID or slug
 * @param {Object} options - Options for the update
 * @param {boolean} options.skipImages - Skip image processing
 * @returns {Promise<Object>} Result of the update operation
 */
async function updateSinglePost(identifier, options = {}) {
  const { skipImages = false } = options;

  try {
    console.log(`\nUpdating post: ${identifier}\n`);

    // Parse the WordPress XML file
    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();

    const wpPosts = parser.getPosts();
    const wpAttachments = parser.getAttachments();

    // Find the post by ID or slug
    let wpPost;
    if (typeof identifier === 'number' || /^\d+$/.test(identifier)) {
      const postId = parseInt(identifier);
      wpPost = wpPosts.find(p => p.wpPostId === postId);
    } else {
      wpPost = wpPosts.find(p => p.slug === identifier);
    }

    if (!wpPost) {
      throw new Error(`Post not found with identifier: ${identifier}`);
    }

    console.log(`Found post: "${wpPost.title}" (ID: ${wpPost.wpPostId}, Slug: ${wpPost.slug})`);
    console.log(`Published: ${wpPost.publishedAt}`);
    console.log(`Categories: ${wpPost.categories.join(', ')}`);
    console.log(`Tags: ${wpPost.tags.join(', ')}\n`);

    // Create attachment lookup map
    const attachmentMap = new Map();
    wpAttachments.forEach(att => {
      attachmentMap.set(att.wpPostId, att);
    });

    // Build lookup maps for references
    const authors = await client.fetch('*[_type == "author"]{ _id, wpAuthorId, name }');
    const categories = await client.fetch('*[_type == "category"]{ _id, wpNicename, title }');
    const tags = await client.fetch('*[_type == "tag"]{ _id, wpNicename, title }');

    const authorMap = new Map();
    authors.forEach(author => {
      if (author.wpAuthorId) {
        authorMap.set(author.wpAuthorId, author._id);
      }
    });

    const categoryMap = new Map();
    categories.forEach(category => {
      if (category.wpNicename) {
        categoryMap.set(category.wpNicename, category._id);
      }
    });

    const tagMap = new Map();
    tags.forEach(tag => {
      if (tag.wpNicename) {
        tagMap.set(tag.wpNicename, tag._id);
      }
    });

    // Check if post already exists in Sanity
    const existingPost = await client.fetch(
      '*[_type == "post" && wpPostId == $wpPostId][0]',
      { wpPostId: wpPost.wpPostId }
    );

    // Find author by login (since we don't have wpAuthorId in post data)
    const author = authors.find(a => a.name === wpPost.authorLogin || a.wpAuthorId === 1); // Fallback to first author
    if (!author) {
      throw new Error(`No author found for post "${wpPost.title}"`);
    }

    // Image asset cache
    const imageAssetCache = new Map();

    // Process featured image first
    let featuredImageAsset = null;
    if (!skipImages && wpPost.featuredImageId) {
      const featuredAttachment = attachmentMap.get(wpPost.featuredImageId);
      if (featuredAttachment && featuredAttachment.url) {
        console.log(`Processing featured image...`);
        const assetId = await uploadImageToSanity(client, featuredAttachment.url, wpPost.title, imageAssetCache);
        if (assetId) {
          featuredImageAsset = {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: assetId
            }
          };
        }
      }
    }

    // Process images in content
    let processedHtml = wpPost.content;
    let imageAssetMap = new Map();

    if (!skipImages) {
      const result = await processImagesInContent(
        client,
        processedHtml,
        wpPost.title,
        imageAssetCache,
        attachmentMap
      );
      processedHtml = result.processedHtml;
      imageAssetMap = result.imageAssetMap;
    } else {
      // Remove all images from HTML when skipping
      processedHtml = wpPost.content.replace(/<img[^>]*>/gi, '');
    }

    // Convert HTML content to Portable Text with proper image references
    const portableTextBody = ContentTransformer.htmlToPortableText(processedHtml, imageAssetMap, attachmentMap);

    // Build category references
    const categoryRefs = wpPost.categories
      .map(catNicename => categoryMap.get(catNicename))
      .filter(Boolean)
      .map(id => ({ _type: 'reference', _ref: id }));

    // Build tag references
    const tagRefs = wpPost.tags
      .map(tagNicename => tagMap.get(tagNicename))
      .filter(Boolean)
      .map(id => ({ _type: 'reference', _ref: id }));

    const postDoc = {
      _type: 'post',
      _id: `post-wp-${wpPost.wpPostId}`,
      title: wpPost.title,
      slug: {
        _type: 'slug',
        current: wpPost.slug || ContentTransformer.createSlug(wpPost.title)
      },
      author: {
        _type: 'reference',
        _ref: author._id
      },
      publishedAt: ContentTransformer.parseWordPressDate(wpPost.publishedAt),
      excerpt: ContentTransformer.cleanExcerpt(wpPost.excerpt),
      body: portableTextBody,
      categories: categoryRefs,
      tags: tagRefs,
      status: 'published',
      wpPostId: wpPost.wpPostId,
      wpPostName: wpPost.slug,
      ...(featuredImageAsset && { featuredImage: featuredImageAsset }),
      seo: {
        metaTitle: wpPost.title.length <= 60 ? wpPost.title : wpPost.title.substring(0, 57) + '...',
        metaDescription: ContentTransformer.cleanExcerpt(wpPost.excerpt).substring(0, 160)
      }
    };

    let result;
    if (existingPost) {
      // Update existing post - patch the published version directly
      const publishedId = existingPost._id.replace(/^drafts\./, '');

      result = await client
        .transaction()
        .patch(publishedId, patch => patch.set({
          title: postDoc.title,
          slug: postDoc.slug,
          author: postDoc.author,
          publishedAt: postDoc.publishedAt,
          excerpt: postDoc.excerpt,
          body: postDoc.body,
          categories: postDoc.categories,
          tags: postDoc.tags,
          status: postDoc.status,
          wpPostName: postDoc.wpPostName,
          ...(featuredImageAsset && { featuredImage: featuredImageAsset }),
          seo: postDoc.seo
        }))
        // Delete any draft version that might exist
        .delete(`drafts.${publishedId}`)
        .commit({ autoGenerateArrayKeys: true });

      console.log(`\n✅ Updated and published post: "${postDoc.title}"`);
      console.log(`   Sanity ID: ${publishedId}`);
      console.log(`   Draft deleted (if existed): drafts.${publishedId}`);
    } else {
      // Create new post and publish it
      const publishedId = postDoc._id;

      result = await client
        .transaction()
        .createOrReplace(postDoc)
        // Delete any draft that might exist
        .delete(`drafts.${publishedId}`)
        .commit({ autoGenerateArrayKeys: true });

      console.log(`\n✅ Created and published post: "${postDoc.title}"`);
      console.log(`   Sanity ID: ${publishedId}`);
    }

    console.log(`   WordPress ID: ${wpPost.wpPostId}`);
    console.log(`   Slug: ${wpPost.slug}`);
    console.log(`   Images processed: ${imageAssetMap.size}`);
    if (featuredImageAsset) {
      console.log(`   Featured image: Yes`);
    }

    return {
      success: true,
      post: wpPost,
      sanityId: existingPost ? existingPost._id : result._id,
      isNew: !existingPost,
      imageCount: imageAssetMap.size
    };

  } catch (error) {
    console.error(`\n❌ Error updating post:`, error.message);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    if (args.length === 0) {
      console.error('\n❌ Error: No post identifier provided');
    }
    console.log('\nUsage:');
    console.log('  node update-single-post.js <post-id-or-slug> [options]');
    console.log('\nOptions:');
    console.log('  --skip-images  Skip image processing');
    console.log('  --production   Override dataset to \'production\' (default uses .env value)');
    console.log('  --help, -h     Show this help message');
    console.log('\nExamples:');
    console.log('  node update-single-post.js 931');
    console.log('  node update-single-post.js my-post-slug');
    console.log('  node update-single-post.js 931 --skip-images');
    console.log('  node update-single-post.js 931 --production');
    process.exit(args.length === 0 ? 1 : 0);
  }

  const identifier = args[0];
  const skipImages = args.includes('--skip-images');

  updateSinglePost(identifier, { skipImages })
    .then((result) => {
      console.log(`\n✅ Post update completed successfully`);
      console.log(`   View at: http://localhost:3000/magazine/${result.post.slug}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Post update failed:', error);
      process.exit(1);
    });
}

module.exports = updateSinglePost;
