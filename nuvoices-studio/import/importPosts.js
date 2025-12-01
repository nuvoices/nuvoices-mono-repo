const { createClient } = require('@sanity/client');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const WordPressParser = require('./parser');
const ContentTransformer = require('./transformers');
const { CATEGORY_MAPPING } = require('./importTaxonomies');
const dotenv = require('dotenv');
dotenv.config();

// Helper function to determine the single category for a post
// Priority: Podcast > Magazine > News
function getPostCategory(wpCategories) {
  const mappedCategories = new Set();

  for (const wpCatNicename of wpCategories) {
    const newCategory = CATEGORY_MAPPING[wpCatNicename];
    if (newCategory) {
      mappedCategories.add(newCategory);
    }
  }

  // Apply priority: podcast > magazine > news
  if (mappedCategories.has('podcast')) {
    return 'podcast';
  }
  if (mappedCategories.has('magazine')) {
    return 'magazine';
  }
  // Default to news
  return 'news';
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

// Helper function to replace image URLs in content with Sanity references
async function processImagesInContent(client, html, postTitle, globalCache) {
  if (!html) return { processedHtml: html, imageAssetMap: new Map() };
  
  // First, replace all old Linode URLs with WP Engine URLs in the HTML
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

async function importPosts(options = {}) {
  const { updateExisting = false, skipImages = false } = options;
  
  try {
    console.log(`Starting post import... (updateExisting: ${updateExisting})`);
    
    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();
    
    const wpPosts = parser.getPosts();
    const wpAttachments = parser.getAttachments();
    console.log(`Found ${wpPosts.length} posts to import`);
    console.log(`Found ${wpAttachments.length} attachments`);
    
    // Global cache for image assets across all posts
    const globalImageAssetCache = new Map();

    // Create attachment lookup map
    const attachmentMap = new Map();
    wpAttachments.forEach(att => {
      attachmentMap.set(att.wpPostId, att);
    });

    // Build lookup maps for references
    const authors = await client.fetch('*[_type == "author"]{ _id, wpAuthorId, name }');
    const categories = await client.fetch('*[_type == "category"]{ _id, "slug": slug.current, title }');
    const tags = await client.fetch('*[_type == "tag"]{ _id, wpNicename, title }');

    const authorMap = new Map();
    authors.forEach(author => {
      if (author.wpAuthorId) {
        authorMap.set(author.wpAuthorId, author._id);
      }
    });

    // Map new category slugs (podcast, magazine, news) to Sanity _ids
    const categoryMap = new Map();
    categories.forEach(category => {
      if (category.slug) {
        categoryMap.set(category.slug, category._id);
      }
    });

    const tagMap = new Map();
    tags.forEach(tag => {
      if (tag.wpNicename) {
        tagMap.set(tag.wpNicename, tag._id);
      }
    });

    console.log(`Found ${authors.length} authors, ${categories.length} categories, ${tags.length} tags in Sanity`);

    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const wpPost of wpPosts) {
      try {
        // Check if post already exists
        const existingPost = await client.fetch(
          '*[_type == "post" && wpPostId == $wpPostId][0]',
          { wpPostId: wpPost.wpPostId }
        );

        if (existingPost && !updateExisting) {
          console.log(`Post "${wpPost.title}" already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Find author by login (since we don't have wpAuthorId in post data)
        const author = authors.find(a => a.name === wpPost.authorLogin || a.wpAuthorId === 1); // Fallback to first author
        if (!author) {
          console.warn(`No author found for post "${wpPost.title}", skipping...`);
          skippedCount++;
          continue;
        }

        // Process featured image first
        let featuredImageAsset = null;
        if (!skipImages && wpPost.featuredImageId) {
          const featuredAttachment = attachmentMap.get(wpPost.featuredImageId);
          if (featuredAttachment && featuredAttachment.url) {
            console.log(`  Processing featured image for post "${wpPost.title}"`);
            const assetId = await uploadImageToSanity(client, featuredAttachment.url, wpPost.title, globalImageAssetCache);
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

        // Process images in content only (gallery attachments not appended)
        let processedHtml = wpPost.content;
        let imageAssetMap = new Map();
        
        if (!skipImages) {
          const result = await processImagesInContent(
            client,
            processedHtml,
            wpPost.title,
            globalImageAssetCache
          );
          processedHtml = result.processedHtml;
          imageAssetMap = result.imageAssetMap;
        } else {
          // Remove all images from HTML when skipping
          processedHtml = wpPost.content.replace(/<img[^>]*>/gi, '');
        }
        
        // Convert HTML content to Portable Text with proper image references
        const portableTextBody = ContentTransformer.htmlToPortableText(processedHtml, imageAssetMap, attachmentMap);

        // Build single category reference using priority: Podcast > Magazine > News
        const postCategory = getPostCategory(wpPost.categories);
        const categoryId = categoryMap.get(postCategory);
        const categoryRef = categoryId ? { _type: 'reference', _ref: categoryId } : null;

        // Build tag references with unique keys
        const tagRefs = wpPost.tags
          .map(tagNicename => tagMap.get(tagNicename))
          .filter(Boolean)
          .map(id => ({
            _key: ContentTransformer.generateKey(),
            _type: 'reference',
            _ref: id
          }));

        // Check if this is a magazine post with images
        const isMagazinePost = postCategory === 'magazine';
        
        const hasImages = imageAssetMap.size > 0;
        
        if (isMagazinePost && hasImages && options.stopOnMagazineImage) {
          console.log('\n🛑 FOUND MAGAZINE POST WITH IMAGES:');
          console.log(`   Title: ${wpPost.title}`);
          console.log(`   Slug: ${wpPost.slug}`);
          console.log(`   Categories: ${wpPost.categories.join(', ')}`);
          console.log(`   Number of images: ${imageAssetMap.size}`);
          console.log(`\n   Check it at: http://localhost:3000/magazine/${wpPost.slug}`);
          console.log('\n   Stopping import as requested...\n');
          
          // Still create/update this post before stopping
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
            categories: categoryRef ? [categoryRef] : [],
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

          if (existingPost) {
            const publishedId = existingPost._id.replace(/^drafts\./, '');

            await client
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
              .delete(`drafts.${publishedId}`)
              .commit({ autoGenerateArrayKeys: true });

            console.log(`Updated and published magazine post: ${postDoc.title}`);
            updatedCount++;
          } else {
            const publishedId = postDoc._id;

            await client
              .transaction()
              .createOrReplace(postDoc)
              .delete(`drafts.${publishedId}`)
              .commit({ autoGenerateArrayKeys: true });

            console.log(`Imported and published magazine post: ${postDoc.title}`);
            importedCount++;
          }
          
          // Return early with the slug information
          return { 
            importedCount, 
            updatedCount, 
            skippedCount,
            stoppedOnPost: {
              title: wpPost.title,
              slug: wpPost.slug,
              categories: wpPost.categories,
              imageCount: imageAssetMap.size
            }
          };
        }

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
          categories: categoryRef ? [categoryRef] : [],
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

          console.log(`Updated and published: ${postDoc.title}`);
          updatedCount++;
        } else {
          // Create new post and publish it
          const publishedId = postDoc._id;

          result = await client
            .transaction()
            .createOrReplace(postDoc)
            // Delete any draft that might exist
            .delete(`drafts.${publishedId}`)
            .commit({ autoGenerateArrayKeys: true });

          console.log(`Imported and published: ${postDoc.title}`);
          importedCount++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error importing post "${wpPost.title}":`, error);
        skippedCount++;
      }
    }

    console.log(`Post import completed: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped`);
    return { importedCount, updatedCount, skippedCount };

  } catch (error) {
    console.error('Error importing posts:', error);
    throw error;
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const updateExisting = args.includes('--update');
  const skipImages = args.includes('--skip-images');
  const stopOnMagazineImage = args.includes('--stop-on-magazine-image');
  
  importPosts({ updateExisting, skipImages, stopOnMagazineImage })
    .then((result) => {
      if (result.stoppedOnPost) {
        console.log(`\n✅ Import stopped on magazine post with images:`);
        console.log(`   Title: ${result.stoppedOnPost.title}`);
        console.log(`   Slug: ${result.stoppedOnPost.slug}`);
        console.log(`   URL: http://localhost:3000/magazine/${result.stoppedOnPost.slug}`);
      } else {
        console.log(`Post import completed successfully: ${result.importedCount} imported, ${result.updatedCount} updated, ${result.skippedCount} skipped`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Post import failed:', error);
      process.exit(1);
    });
}

module.exports = importPosts;