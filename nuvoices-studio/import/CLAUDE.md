# WordPress to Sanity Migration

This folder contains the code and data for importing content from the old WordPress website to the Sanity database.

## Files

- `nuvoices.xml` - WordPress export XML file containing all the content from the old website
- `package.json` - Dependencies and scripts for the import process
- `import.js` - Main import script with CLI interface
- `parser.js` - WordPress XML parser
- `transformers.js` - Content transformation utilities (HTML to Portable Text)
- `importAuthors.js` - Author import script
- `importTaxonomies.js` - Category and tag import script
- `importPosts.js` - Post import script

## Migration Process

### Prerequisites

1. **Install dependencies:**
   ```bash
   cd nuvoices-studio/import
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export SANITY_STUDIO_PROJECT_ID="6bg89hff"
   export SANITY_STUDIO_DATASET="staging"  # or "production"
   export SANITY_AUTH_TOKEN="your_sanity_auth_token"
   ```

3. **Get Sanity Auth Token:**
   - Go to https://sanity.io/manage
   - Select your project
   - Go to API tokens
   - Create a new token with Editor permissions

### Running the Migration

#### Full Migration (Recommended)
```bash
npm run import
```

#### Step-by-step Migration
```bash
npm run import:authors      # Import authors first
npm run import:taxonomies   # Import categories and tags
npm run import:posts        # Import posts last
```

### Schema Changes Made

The migration creates these new content types in Sanity:

1. **Author** - WordPress authors with bio, avatar, contact info
2. **Category** - Hierarchical categories with parent-child relationships
3. **Tag** - Simple tags for content labeling
4. **Post** - Blog posts with Portable Text content, references to authors, categories, and tags

### Content Transformations

- **HTML to Portable Text**: WordPress HTML content is converted to Sanity's structured Portable Text format
- **Taxonomy References**: Categories and tags become proper references instead of flat text
- **Author Attribution**: Posts are linked to author documents
- **SEO Fields**: Meta titles and descriptions are extracted and structured
- **Publication Dates**: WordPress dates are properly formatted for Sanity

### Post-Migration Steps

1. **Review Content**: Check imported content in Sanity Studio
2. **Media Migration**: Manually upload and link media assets (images, files)
3. **Content Cleanup**: Review and adjust content formatting as needed
4. **Update Frontend**: Modify Next.js app to use new content structure
5. **SEO Validation**: Verify meta titles and descriptions are appropriate

### Troubleshooting

- **Authentication Errors**: Verify your SANITY_AUTH_TOKEN has correct permissions
- **Missing References**: Ensure authors and taxonomies are imported before posts
- **Content Formatting**: Check the transformers.js file for HTML conversion issues
- **Rate Limiting**: The import includes delays to prevent API rate limiting

### Content Structure

The imported content maintains WordPress's hierarchical structure:
- **NüStories Magazine** as parent category
- **Opinion**, **Personal Essay**, **Photography**, **Profiles**, **Q&A** as child categories
- **Books**, **Events**, **JOB**, **Podcast** as top-level categories

This preserves the existing content organization while providing better structure for the new Sanity-based site.