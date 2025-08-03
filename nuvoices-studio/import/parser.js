const fs = require('fs');
const xml2js = require('xml2js');

class WordPressParser {
  constructor(xmlFilePath) {
    this.xmlFilePath = xmlFilePath;
    this.data = null;
  }

  async parseXML() {
    try {
      const xmlContent = fs.readFileSync(this.xmlFilePath, 'utf8');
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true 
      });
      
      const result = await parser.parseStringPromise(xmlContent);
      this.data = result.rss.channel;
      return this.data;
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw error;
    }
  }

  getAuthors() {
    if (!this.data || !this.data['wp:author']) {
      return [];
    }

    const authors = Array.isArray(this.data['wp:author']) 
      ? this.data['wp:author'] 
      : [this.data['wp:author']];

    return authors.map(author => ({
      wpAuthorId: parseInt(author['wp:author_id']),
      login: author['wp:author_login'],
      email: author['wp:author_email'],
      displayName: author['wp:author_display_name'],
      firstName: author['wp:author_first_name'] || '',
      lastName: author['wp:author_last_name'] || '',
    }));
  }

  getCategories() {
    if (!this.data || !this.data['wp:category']) {
      return [];
    }

    const categories = Array.isArray(this.data['wp:category'])
      ? this.data['wp:category']
      : [this.data['wp:category']];

    return categories.map(cat => ({
      wpTermId: parseInt(cat['wp:term_id']),
      nicename: cat['wp:category_nicename'],
      parent: cat['wp:category_parent'] || null,
      name: cat['wp:cat_name'],
      description: cat['wp:category_description'] || '',
    }));
  }

  getTags() {
    if (!this.data || !this.data['wp:tag']) {
      return [];
    }

    const tags = Array.isArray(this.data['wp:tag'])
      ? this.data['wp:tag']
      : [this.data['wp:tag']];

    return tags.map(tag => ({
      nicename: tag['wp:tag_slug'],
      name: tag['wp:tag_name'],
      description: tag['wp:tag_description'] || '',
    }));
  }

  getPosts() {
    if (!this.data || !this.data.item) {
      return [];
    }

    const items = Array.isArray(this.data.item) 
      ? this.data.item 
      : [this.data.item];

    return items
      .filter(item => item['wp:post_type'] === 'post' && item['wp:status'] === 'publish')
      .map(item => {
        // Parse categories
        const categories = [];
        const tags = [];
        
        if (item.category) {
          const cats = Array.isArray(item.category) ? item.category : [item.category];
          cats.forEach(cat => {
            if (typeof cat === 'object' && cat.domain) {
              if (cat.domain === 'category') {
                categories.push(cat.nicename);
              } else if (cat.domain === 'post_tag') {
                tags.push(cat.nicename);
              }
            }
          });
        }

        return {
          wpPostId: parseInt(item['wp:post_id']),
          title: item.title,
          slug: item['wp:post_name'],
          content: item['content:encoded'] || '',
          excerpt: item['excerpt:encoded'] || '',
          publishedAt: item.pubDate,
          authorLogin: item['dc:creator'],
          status: item['wp:status'],
          categories,
          tags,
        };
      });
  }

  getAttachments() {
    if (!this.data || !this.data.item) {
      return [];
    }

    const items = Array.isArray(this.data.item) 
      ? this.data.item 
      : [this.data.item];

    return items
      .filter(item => item['wp:post_type'] === 'attachment')
      .map(item => ({
        wpPostId: parseInt(item['wp:post_id']),
        title: item.title,
        url: item['wp:attachment_url'],
        fileName: item['wp:post_name'],
        mimeType: item['wp:post_mime_type'],
        content: item['content:encoded'] || '',
      }));
  }
}

module.exports = WordPressParser;