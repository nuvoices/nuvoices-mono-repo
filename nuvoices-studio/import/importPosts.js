const { createClient } = require('@sanity/client');
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

async function importPosts() {
  try {
    console.log('Starting post import...');
    
    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();
    
    const wpPosts = parser.getPosts();
    console.log(`Found ${wpPosts.length} posts to import`);

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

        // Convert HTML content to Portable Text
        const portableTextBody = ContentTransformer.htmlToPortableText(wpPost.content);

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