const { createClient } = require('@sanity/client');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const WordPressParser = require('./parser');
const ContentTransformer = require('./transformers');

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

// Helper function to download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
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
    
    console.log(`  Downloading image: ${imageUrl}`);
    const imageBuffer = await downloadImage(imageUrl);
    
    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1] || 'image.jpg';
    
    console.log(`  Uploading new image to Sanity: ${filename}`);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename,
      source: {
        name: 'wordpress-import',
        url: imageUrl
      }
    });
    
    // Cache the new asset
    if (cache) cache.set(imageUrl, asset._id);
    
    return asset._id;
  } catch (error) {
    console.error(`  Failed to upload image ${imageUrl}:`, error.message);
    return null;
  }
}

// Helper function to replace image URLs in content with Sanity references
async function processImagesInContent(client, html, postTitle, globalCache) {
  if (!html) return html;
  
  const imageUrls = extractImageUrls(html);
  const imageAssetMap = new Map();
  
  if (imageUrls.length > 0) {
    console.log(`  Processing ${imageUrls.length} images for post "${postTitle}"`);
    
    for (const imageUrl of imageUrls) {
      if (!imageAssetMap.has(imageUrl)) {
        const assetId = await uploadImageToSanity(client, imageUrl, postTitle, globalCache);
        if (assetId) {
          imageAssetMap.set(imageUrl, assetId);
        }
      }
    }
  }
  
  return { processedHtml: html, imageAssetMap };
}

async function importPosts() {
  try {
    console.log('Starting post import...');
    
    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();
    
    const wpPosts = parser.getPosts();
    console.log(`Found ${wpPosts.length} posts to import`);
    
    // Global cache for image assets across all posts
    const globalImageAssetCache = new Map();

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

    console.log(`Found ${authors.length} authors, ${categories.length} categories, ${tags.length} tags in Sanity`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const wpPost of wpPosts) {
      try {
        // Check if post already exists
        const existingPost = await client.fetch(
          '*[_type == "post" && wpPostId == $wpPostId][0]',
          { wpPostId: wpPost.wpPostId }
        );

        if (existingPost) {
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

        // Process images in content
        const { processedHtml, imageAssetMap } = await processImagesInContent(
          client,
          wpPost.content,
          wpPost.title,
          globalImageAssetCache
        );
        
        // Convert HTML content to Portable Text with proper image references
        const portableTextBody = ContentTransformer.htmlToPortableText(processedHtml, imageAssetMap);

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
            current: ContentTransformer.createSlug(wpPost.slug || wpPost.title)
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
          seo: {
            metaTitle: wpPost.title.length <= 60 ? wpPost.title : wpPost.title.substring(0, 57) + '...',
            metaDescription: ContentTransformer.cleanExcerpt(wpPost.excerpt).substring(0, 160)
          }
        };

        const result = await client.create(postDoc);
        console.log(`Imported post: ${postDoc.title}`);
        importedCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error importing post "${wpPost.title}":`, error);
        skippedCount++;
      }
    }

    console.log(`Post import completed: ${importedCount} imported, ${skippedCount} skipped`);
    return { importedCount, skippedCount };

  } catch (error) {
    console.error('Error importing posts:', error);
    throw error;
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importPosts()
    .then((result) => {
      console.log(`Post import completed successfully: ${result.importedCount} imported, ${result.skippedCount} skipped`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Post import failed:', error);
      process.exit(1);
    });
}

module.exports = importPosts;