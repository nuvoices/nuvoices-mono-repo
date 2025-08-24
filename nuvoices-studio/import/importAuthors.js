const { createClient } = require('@sanity/client');
const WordPressParser = require('./parser');
const ContentTransformer = require('./transformers');
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.SANITY_STUDIO_PROJECT_ID || !process.env.SANITY_STUDIO_DATASET) {
  throw new Error('Missing Sanity Studio project ID or dataset environment variables');
}

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN, // You'll need to set this
  apiVersion: '2023-05-03'
});

async function importAuthors() {
  try {
    console.log('Starting author import...');
    
    const parser = new WordPressParser('./nuvoices.xml');
    await parser.parseXML();
    
    const wpAuthors = parser.getAuthors();
    console.log(`Found ${wpAuthors.length} authors to import`);

    const transaction = client.transaction();
    
    for (const wpAuthor of wpAuthors) {
      // Check if author already exists by wpAuthorId
      const existingAuthor = await client.fetch(
        '*[_type == "author" && wpAuthorId == $wpAuthorId][0]',
        { wpAuthorId: wpAuthor.wpAuthorId }
      );

      if (existingAuthor) {
        console.log(`Author "${wpAuthor.displayName}" already exists, skipping...`);
        continue;
      }

      const authorDoc = {
        _type: 'author',
        _id: `author-wp-${wpAuthor.wpAuthorId}`,
        name: wpAuthor.displayName || `${wpAuthor.firstName} ${wpAuthor.lastName}`.trim(),
        slug: {
          _type: 'slug',
          current: ContentTransformer.createSlug(wpAuthor.login || wpAuthor.displayName)
        },
        firstName: wpAuthor.firstName,
        lastName: wpAuthor.lastName,
        email: wpAuthor.email,
        wpAuthorId: wpAuthor.wpAuthorId,
        bio: '', // Will be filled manually if needed
      };

      transaction.createOrReplace(authorDoc);
      console.log(`Queued author: ${authorDoc.name}`);
    }

    // Commit the transaction
    const result = await transaction.commit();
    console.log(`Successfully imported ${result.results.length} authors`);
    
    return result;
  } catch (error) {
    console.error('Error importing authors:', error);
    throw error;
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importAuthors()
    .then(() => {
      console.log('Author import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Author import failed:', error);
      process.exit(1);
    });
}

module.exports = importAuthors;