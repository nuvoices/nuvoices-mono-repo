#!/usr/bin/env node

const importAuthors = require('./importAuthors');
const { importTaxonomies } = require('./importTaxonomies');
const importPosts = require('./importPosts');
const dotenv = require('dotenv');
dotenv.config();

async function runFullImport() {
  console.log('🚀 Starting WordPress to Sanity migration...\n');
  
  try {
    // Step 1: Import Authors
    console.log('📝 Step 1: Importing authors...');
    await importAuthors();
    console.log('✅ Authors imported successfully\n');

    // Step 2: Import Categories and Tags
    console.log('🏷️  Step 2: Importing categories and tags...');
    await importTaxonomies();
    console.log('✅ Categories and tags imported successfully\n');

    // Step 3: Import Posts
    console.log('📰 Step 3: Importing posts...');
    const postResult = await importPosts();
    console.log('✅ Posts imported successfully\n');

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Posts imported: ${postResult.importedCount}`);
    console.log(`   - Posts skipped: ${postResult.skippedCount}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review imported content in Sanity Studio');
    console.log('   2. Upload and link media assets manually');
    console.log('   3. Verify content formatting and make adjustments');
    console.log('   4. Update Next.js app to use new content structure');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
WordPress to Sanity Migration Tool

Usage:
  node import.js [options]

Options:
  --authors     Import only authors
  --taxonomies  Import only categories and tags  
  --posts       Import only posts
  --help, -h    Show this help message

Environment Variables Required:
  SANITY_STUDIO_PROJECT_ID  - Your Sanity project ID
  SANITY_STUDIO_DATASET     - Your Sanity dataset name
  SANITY_AUTH_TOKEN         - Your Sanity auth token with write permissions

Examples:
  node import.js                 # Run full import
  node import.js --authors       # Import only authors
  node import.js --taxonomies    # Import only categories and tags
  node import.js --posts         # Import only posts
`);
  process.exit(0);
}

// Check required environment variables
const requiredEnvVars = ['SANITY_STUDIO_PROJECT_ID', 'SANITY_STUDIO_DATASET', 'SANITY_AUTH_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables and try again.');
  process.exit(1);
}

// Run specific imports based on arguments
async function main() {
  console.log('>>>>', process.env.SANITY_STUDIO_PROJECT_ID);
  try {
    if (args.includes('--authors')) {
      console.log('📝 Importing authors only...');
      await importAuthors();
      console.log('✅ Authors imported successfully');
    } else if (args.includes('--taxonomies')) {
      console.log('🏷️ Importing categories and tags only...');
      await importTaxonomies();
      console.log('✅ Categories and tags imported successfully');
    } else if (args.includes('--posts')) {
      console.log('📰 Importing posts only...');
      const result = await importPosts();
      console.log(`✅ Posts imported successfully: ${result.importedCount} imported, ${result.skippedCount} skipped`);
    } else {
      // Run full import
      await runFullImport();
    }
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

main();