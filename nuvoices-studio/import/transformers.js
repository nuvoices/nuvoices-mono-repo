const { JSDOM } = require('jsdom');
const crypto = require('crypto');

class ContentTransformer {
  /**
   * Generate a unique key for Sanity blocks
   */
  static generateKey() {
    return crypto.randomBytes(12).toString('base64').replace(/[/+=]/g, '').substring(0, 12);
  }

  static createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')
      .substring(0, 96);
  }

  /**
   * Extract embed data from any URL (iframe src, plain URL, or shortcode URL)
   */
  static extractEmbedData(urlString) {
    if (!urlString) return null;

    try {
      const url = new URL(urlString);
      const hostname = url.hostname.toLowerCase().replace('www.', '');
      let platform = 'unknown';
      let embedId = null;
      let embedUrl = urlString;

      // Detect platform and extract embedId
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        platform = 'youtube';
        if (hostname.includes('youtu.be')) {
          // youtu.be/VIDEO_ID
          const match = url.pathname.match(/\/([^/?]+)/);
          embedId = match ? match[1] : null;
        } else if (url.pathname.includes('/embed/')) {
          // youtube.com/embed/VIDEO_ID
          const match = url.pathname.match(/\/embed\/([^/?]+)/);
          embedId = match ? match[1] : null;
        } else {
          // youtube.com/watch?v=VIDEO_ID
          embedId = url.searchParams.get('v');
        }
        if (embedId) {
          embedUrl = `https://www.youtube.com/embed/${embedId}`;
        }
      } else if (hostname.includes('vimeo.com')) {
        platform = 'vimeo';
        if (url.pathname.includes('/video/')) {
          // player.vimeo.com/video/VIDEO_ID
          const match = url.pathname.match(/\/video\/(\d+)/);
          embedId = match ? match[1] : null;
        } else {
          // vimeo.com/VIDEO_ID
          const match = url.pathname.match(/\/(\d+)/);
          embedId = match ? match[1] : null;
        }
        if (embedId) {
          embedUrl = `https://player.vimeo.com/video/${embedId}`;
        }
      } else if (hostname.includes('art19.com')) {
        platform = 'art19';
        // art19.com/shows/SHOW/episodes/EPISODE_ID or /embed
        const match = url.pathname.match(/\/episodes\/([^/?]+)/);
        embedId = match ? match[1] : null;
        // Ensure URL has /embed at the end for the iframe
        if (embedId && !url.pathname.includes('/embed')) {
          embedUrl = `https://art19.com/shows/nuvoices/episodes/${embedId}/embed`;
        }
      } else if (hostname.includes('acast.com')) {
        platform = 'acast';
        // embed.acast.com/SHOW_ID/EPISODE_ID
        const parts = url.pathname.split('/').filter(Boolean);
        embedId = parts.join('/') || null;
      } else if (hostname.includes('buzzsprout.com')) {
        platform = 'buzzsprout';
        // buzzsprout.com/SHOW_ID/EPISODE_ID
        const match = url.pathname.match(/\/(\d+)\/(\d+)/);
        embedId = match ? `${match[1]}/${match[2]}` : null;
      } else if (hostname.includes('amazon.com') && url.pathname.includes('/read/')) {
        platform = 'amazon';
        // read.amazon.com/kp/embed?asin=ASIN
        embedId = url.searchParams.get('asin');
      }

      return {
        platform,
        embedId,
        url: embedUrl
      };
    } catch (error) {
      console.warn('Failed to parse embed URL:', urlString, error);
      return null;
    }
  }

  /**
   * Legacy method for backwards compatibility
   */
  static extractIframeData(src) {
    return this.extractEmbedData(src);
  }

  /**
   * Preprocess HTML to convert WordPress shortcodes and plain embed URLs to iframes
   */
  static preprocessEmbeds(html) {
    if (!html) return html;

    // Convert [embed]URL[/embed] shortcodes to temporary placeholders
    html = html.replace(/\[embed\](https?:\/\/[^\]]+)\[\/embed\]/g, (match, url) => {
      return `<div class="wp-embed-placeholder" data-url="${url}"></div>`;
    });

    // Convert standalone embed URLs (lines/divs that contain just URLs for known platforms)
    // This matches URLs that appear on their own line or within simple tags
    const embedUrlPattern = /(^|>|\n)\s*(https?:\/\/(?:www\.)?(youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d+|player\.vimeo\.com\/video|art19\.com\/shows\/[^\/]+\/episodes|embed\.acast\.com|buzzsprout\.com\/\d+\/\d+|read\.amazon\.com\/kp)[^\s<]*)\s*(<|$|\n)/g;
    html = html.replace(embedUrlPattern, (match, before, url, after) => {
      return `${before}<div class="wp-embed-placeholder" data-url="${url}"></div>${after}`;
    });

    return html;
  }

  static htmlToPortableText(html, imageAssetMap = new Map()) {
    if (!html || html.trim() === '') {
      return [];
    }

    try {
      // Preprocess to convert WordPress embeds to a parseable format
      html = this.preprocessEmbeds(html);

      const dom = new JSDOM(html);
      const document = dom.window.document;
      const body = document.body;

      return this.parseElement(body, imageAssetMap);
    } catch (error) {
      console.error('Error converting HTML to Portable Text:', error);
      // Fallback: return as a single text block
      return [{
        _key: this.generateKey(),
        _type: 'block',
        style: 'normal',
        children: [{
          _key: this.generateKey(),
          _type: 'span',
          text: html.replace(/<[^>]*>/g, ''), // Strip HTML tags
          marks: []
        }]
      }];
    }
  }

  static parseElement(element, imageAssetMap = new Map()) {
    const blocks = [];

    for (const child of element.childNodes) {
      if (child.nodeType === 3) { // Text node
        const text = child.textContent.trim();
        if (text) {
          blocks.push({
            _key: this.generateKey(),
            _type: 'block',
            style: 'normal',
            children: [{
              _key: this.generateKey(),
              _type: 'span',
              text: text,
              marks: []
            }]
          });
        }
      } else if (child.nodeType === 1) { // Element node
        const block = this.convertElementToBlock(child, imageAssetMap);
        if (block) {
          if (Array.isArray(block)) {
            blocks.push(...block);
          } else {
            blocks.push(block);
          }
        }
      }
    }

    return blocks.length > 0 ? blocks : [{
      _key: this.generateKey(),
      _type: 'block',
      style: 'normal',
      children: [{
        _key: this.generateKey(),
        _type: 'span',
        text: '',
        marks: []
      }]
    }];
  }

  static convertElementToBlock(element, imageAssetMap = new Map()) {
    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent.trim();

    switch (tagName) {
      case 'h1':
        return {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h1',
          children: this.parseInlineElements(element)
        };
      case 'h2':
        return {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h2',
          children: this.parseInlineElements(element)
        };
      case 'h3':
        return {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h3',
          children: this.parseInlineElements(element)
        };
      case 'h4':
        return {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h4',
          children: this.parseInlineElements(element)
        };
      case 'p':
        return {
          _key: this.generateKey(),
          _type: 'block',
          style: 'normal',
          children: this.parseInlineElements(element)
        };
      case 'blockquote':
        return {
          _key: this.generateKey(),
          _type: 'block',
          style: 'blockquote',
          children: this.parseInlineElements(element)
        };
      case 'ul':
        return this.parseList(element, 'bullet', imageAssetMap);
      case 'ol':
        return this.parseList(element, 'number', imageAssetMap);
      case 'img':
        const imgSrc = element.src || element.getAttribute('src');
        const assetId = imageAssetMap.get(imgSrc);
        if (!assetId) {
          // Skip image if no asset was uploaded
          console.warn(`Skipping image without uploaded asset: ${imgSrc}`);
          return null;
        }
        return {
          _key: this.generateKey(),
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: assetId
          },
          alt: element.alt || '',
          caption: element.title || ''
        };
      case 'iframe':
        const iframeSrc = element.src || element.getAttribute('src');
        if (!iframeSrc) {
          console.warn('Skipping iframe without src attribute');
          return null;
        }

        const embedData = this.extractIframeData(iframeSrc);
        if (!embedData) {
          console.warn(`Skipping iframe with invalid src: ${iframeSrc}`);
          return null;
        }

        const embedBlock = {
          _key: this.generateKey(),
          _type: 'embed',
          url: embedData.url,
          platform: embedData.platform
        };

        // Add embedId if available
        if (embedData.embedId) {
          embedBlock.embedId = embedData.embedId;
        }

        // Add caption from iframe title if available
        const iframeTitle = element.getAttribute('title');
        if (iframeTitle) {
          embedBlock.caption = iframeTitle;
        }

        console.log(`  Found ${embedData.platform} embed: ${iframeSrc.substring(0, 60)}...`);
        return embedBlock;
      case 'br':
        return null; // Ignore line breaks
      case 'div':
        // Check if this is a wp-embed-placeholder
        if (element.classList && element.classList.contains('wp-embed-placeholder')) {
          const embedUrl = element.getAttribute('data-url');
          if (embedUrl) {
            const embedData = this.extractEmbedData(embedUrl);
            if (embedData && embedData.platform !== 'unknown') {
              const embedBlock = {
                _key: this.generateKey(),
                _type: 'embed',
                url: embedData.url,
                platform: embedData.platform
              };

              if (embedData.embedId) {
                embedBlock.embedId = embedData.embedId;
              }

              console.log(`  Found ${embedData.platform} embed from URL: ${embedUrl.substring(0, 60)}...`);
              return embedBlock;
            }
          }
        }
        // Handle as container, parse children
        return this.parseElement(element, imageAssetMap);
      case 'span':
        // Handle as container, parse children
        return this.parseElement(element, imageAssetMap);
      default:
        if (textContent) {
          return {
            _key: this.generateKey(),
            _type: 'block',
            style: 'normal',
            children: this.parseInlineElements(element)
          };
        }
        return null;
    }
  }

  static parseInlineElements(element) {
    const children = [];

    for (const child of element.childNodes) {
      if (child.nodeType === 3) { // Text node
        const text = child.textContent;
        if (text) {
          children.push({
            _key: this.generateKey(),
            _type: 'span',
            text: text,
            marks: []
          });
        }
      } else if (child.nodeType === 1) { // Element node
        const inline = this.convertInlineElement(child);
        if (inline) {
          if (Array.isArray(inline)) {
            children.push(...inline);
          } else {
            children.push(inline);
          }
        }
      }
    }

    return children.length > 0 ? children : [{
      _key: this.generateKey(),
      _type: 'span',
      text: '',
      marks: []
    }];
  }

  static convertInlineElement(element) {
    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent;

    const marks = [];

    switch (tagName) {
      case 'strong':
      case 'b':
        marks.push('strong');
        break;
      case 'em':
      case 'i':
        marks.push('em');
        break;
      case 'code':
        marks.push('code');
        break;
      case 'a':
        const href = element.href;
        if (href) {
          marks.push({
            _type: 'link',
            href: href,
            blank: element.target === '_blank'
          });
        }
        break;
    }

    if (textContent) {
      return {
        _key: this.generateKey(),
        _type: 'span',
        text: textContent,
        marks: marks
      };
    }

    // For nested elements, parse children
    return this.parseInlineElements(element);
  }

  static parseList(listElement, listType, imageAssetMap = null) {
    const items = [];

    for (const child of listElement.children) {
      if (child.tagName.toLowerCase() === 'li') {
        items.push({
          _key: this.generateKey(),
          _type: 'block',
          style: 'normal',
          listItem: listType,
          children: this.parseInlineElements(child)
        });
      }
    }

    return items;
  }

  static cleanExcerpt(excerpt) {
    if (!excerpt) return '';
    
    // Remove HTML tags and WordPress-specific content
    return excerpt
      .replace(/<[^>]*>/g, '')
      .replace(/\[&hellip;\]/g, '...')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  static parseWordPressDate(wpDate) {
    // WordPress dates are typically in format: "Wed, 21 Jul 2025 08:20:06 +0000"
    try {
      return new Date(wpDate).toISOString();
    } catch (error) {
      console.error('Error parsing date:', wpDate, error);
      return new Date().toISOString();
    }
  }
}

module.exports = ContentTransformer;