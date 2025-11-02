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

  /**
   * Extract attributes from WordPress caption shortcode
   */
  static extractCaptionAttributes(captionTag) {
    const attrs = {};

    // Extract width
    const widthMatch = captionTag.match(/width=["']?(\d+)["']?/i);
    if (widthMatch) attrs.width = parseInt(widthMatch[1], 10);

    // Extract height (less common but possible)
    const heightMatch = captionTag.match(/height=["']?(\d+)["']?/i);
    if (heightMatch) attrs.height = parseInt(heightMatch[1], 10);

    // Extract align
    const alignMatch = captionTag.match(/align=["']?(alignnone|alignleft|aligncenter|alignright)["']?/i);
    if (alignMatch) attrs.align = alignMatch[1];

    return attrs;
  }

  /**
   * Preprocess horizontal rule markers (---) to convert to proper <hr> tags
   * Handles patterns like:
   * - <p>---</p>
   * - <p>--- </p>
   * - Standalone --- on its own line
   */
  static preprocessHorizontalRules(html) {
    if (!html) return html;

    // Convert <p>---</p> to <hr />
    html = html.replace(/<p>\s*---\s*<\/p>/gi, '<hr />');

    // Convert standalone --- (not in tags) at line boundaries
    html = html.replace(/(^|\n)\s*---\s*($|\n)/g, '$1<hr />$2');

    return html;
  }

  /**
   * Preprocess WordPress caption shortcodes to preserve image-caption relationship
   * Handles multiple WordPress caption formats:
   * 1. <p>[caption ...]</p><img ...><p>Caption text[/caption]</p>
   * 2. [caption ...]</p><img ...><p>Caption text[/caption]
   * 3. [caption ...]<img ...>Caption text[/caption]
   * Converts to: <figure data-wp-caption data-width="..." data-align="..."><img ...><figcaption>Caption text</figcaption></figure>
   */
  static preprocessCaptions(html) {
    if (!html) return html;

    // Pattern 1: Standard format with full <p> tags
    // <p>[caption id="..." ...]</p> <img ...> <p>Caption text[/caption]</p>
    // Allow whitespace (including newlines) between [/caption] and </p>
    const standardPattern = /<p>(\[caption[^\]]*\])<\/p>\s*(<img[^>]*>)\s*<p>\s*([^]*?)\[\/caption\]\s*<\/p>/gi;

    html = html.replace(standardPattern, (match, captionTag, imgTag, captionText) => {
      const attrs = this.extractCaptionAttributes(captionTag);
      const cleanCaption = captionText.replace(/<br\s*\/?>/gi, ' ').trim();

      let figureAttrs = 'data-wp-caption';
      if (attrs.width) figureAttrs += ` data-width="${attrs.width}"`;
      if (attrs.height) figureAttrs += ` data-height="${attrs.height}"`;
      if (attrs.align) figureAttrs += ` data-align="${attrs.align}"`;

      return `<figure ${figureAttrs}>${imgTag}<figcaption>${cleanCaption}</figcaption></figure>`;
    });

    // Pattern 2: Variant without opening <p> tag or closing </p> tag
    // [caption id="..." ...]</p> <img ...> <p>Caption text[/caption]
    const variantPattern = /(\[caption[^\]]*\])<\/p>\s*(<img[^>]*>)\s*<p>\s*([^]*?)\[\/caption\]/gi;

    html = html.replace(variantPattern, (match, captionTag, imgTag, captionText) => {
      const attrs = this.extractCaptionAttributes(captionTag);
      const cleanCaption = captionText.replace(/<br\s*\/?>/gi, ' ').trim();

      let figureAttrs = 'data-wp-caption';
      if (attrs.width) figureAttrs += ` data-width="${attrs.width}"`;
      if (attrs.height) figureAttrs += ` data-height="${attrs.height}"`;
      if (attrs.align) figureAttrs += ` data-align="${attrs.align}"`;

      return `<figure ${figureAttrs}>${imgTag}<figcaption>${cleanCaption}</figcaption></figure>`;
    });

    // Pattern 3: Inline version (completely unwrapped)
    // [caption ...]<img ...>Caption text[/caption]
    const inlinePattern = /(\[caption[^\]]*\])(<img[^>]*>)([^]*?)\[\/caption\]/gi;

    html = html.replace(inlinePattern, (match, captionTag, imgTag, captionText) => {
      const attrs = this.extractCaptionAttributes(captionTag);
      const cleanCaption = captionText.replace(/<br\s*\/?>/gi, ' ').trim();

      let figureAttrs = 'data-wp-caption';
      if (attrs.width) figureAttrs += ` data-width="${attrs.width}"`;
      if (attrs.height) figureAttrs += ` data-height="${attrs.height}"`;
      if (attrs.align) figureAttrs += ` data-align="${attrs.align}"`;

      return `<figure ${figureAttrs}>${imgTag}<figcaption>${cleanCaption}</figcaption></figure>`;
    });

    return html;
  }

  /**
   * Preprocess WordPress gallery shortcodes to convert them to individual images (vertically aligned)
   * Handles formats like:
   * - [gallery ids="1,2,3"]
   * - [gallery columns="2" ids="1,2,3,4"]
   * Converts to: <figure><img src="URL" alt="Title"><figcaption>Title</figcaption></figure> (repeated for each image)
   *
   * @param {string} html - HTML content containing gallery shortcodes
   * @param {Map} attachmentMap - Map of WordPress post IDs to attachment objects
   * @returns {string} HTML with gallery shortcodes replaced by individual images
   */
  static preprocessGalleries(html, attachmentMap = new Map()) {
    if (!html || attachmentMap.size === 0) return html;

    // Pattern to match gallery shortcodes: [gallery ...ids="1,2,3"...]
    const galleryPattern = /\[gallery\s+([^\]]+)\]/gi;

    html = html.replace(galleryPattern, (match, attributes) => {
      // Extract the ids attribute
      const idsMatch = attributes.match(/ids=["']([^"']+)["']/i);
      if (!idsMatch) {
        console.warn(`Gallery shortcode found without ids attribute: ${match}`);
        return match; // Return unchanged if no ids found
      }

      const ids = idsMatch[1].split(',').map(id => parseInt(id.trim(), 10));

      // Build HTML for each image in the gallery
      const imageHtmlArray = ids.map(id => {
        const attachment = attachmentMap.get(id);
        if (!attachment) {
          console.warn(`Gallery image ID ${id} not found in attachments`);
          return ''; // Skip missing attachments
        }

        // Use the full size image URL
        const imgUrl = attachment.url;
        const imgTitle = attachment.title || '';
        const imgAlt = imgTitle; // Use title as alt text

        // Create a figure element for each image (vertically stacked)
        return `<figure class="wp-gallery-image"><img src="${imgUrl}" alt="${imgAlt}"><figcaption>${imgTitle}</figcaption></figure>`;
      }).filter(Boolean); // Remove empty entries

      // Join all images vertically (each in its own figure)
      return imageHtmlArray.join('\n');
    });

    return html;
  }

  static htmlToPortableText(html, imageAssetMap = new Map(), attachmentMap = new Map()) {
    if (!html || html.trim() === '') {
      return [];
    }

    try {
      // Preprocess WordPress shortcodes and markdown
      html = this.preprocessHorizontalRules(html);
      html = this.preprocessGalleries(html, attachmentMap); // Process galleries before captions
      html = this.preprocessCaptions(html);
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
    const inlineTagNames = ['b', 'strong', 'i', 'em', 'code', 'a', 'span'];
    const blockTagNames = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'div', 'figure', 'img', 'iframe', 'hr'];

    // Helper to check if a node is inline content
    const isInlineContent = (node) => {
      if (node.nodeType === 3) { // Text node - always inline, including whitespace
        return true;
      }
      if (node.nodeType === 1) { // Element node
        const tagName = node.tagName.toLowerCase();
        // Inline if it's in the inline list, or if it's NOT in the block list
        return inlineTagNames.includes(tagName) || !blockTagNames.includes(tagName);
      }
      return false;
    };

    // Collect consecutive inline content into paragraphs
    let inlineBuffer = [];

    for (const child of element.childNodes) {
      if (isInlineContent(child)) {
        inlineBuffer.push(child);
      } else {
        // Flush inline buffer if we have accumulated inline content
        if (inlineBuffer.length > 0) {
          const paragraph = this.createParagraphFromInlineContent(inlineBuffer);
          if (paragraph) blocks.push(paragraph);
          inlineBuffer = [];
        }

        // Process block-level element
        if (child.nodeType === 1) {
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
    }

    // Flush any remaining inline content
    if (inlineBuffer.length > 0) {
      const paragraph = this.createParagraphFromInlineContent(inlineBuffer);
      if (paragraph) blocks.push(paragraph);
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

  /**
   * Create a paragraph block from a sequence of inline content nodes (text nodes and inline elements)
   */
  static createParagraphFromInlineContent(nodes) {
    const children = [];
    const markDefs = [];

    for (const node of nodes) {
      if (node.nodeType === 3) { // Text node
        const text = node.textContent;
        if (text) {
          children.push({
            _key: this.generateKey(),
            _type: 'span',
            text: text,
            marks: []
          });
        }
      } else if (node.nodeType === 1) { // Element node
        const result = this.convertInlineElement(node, markDefs);
        if (result) {
          if (Array.isArray(result)) {
            children.push(...result);
          } else {
            children.push(result);
          }
        }
      }
    }

    if (children.length === 0) return null;

    const block = {
      _key: this.generateKey(),
      _type: 'block',
      style: 'normal',
      children
    };
    if (markDefs.length > 0) block.markDefs = markDefs;
    return block;
  }

  static convertElementToBlock(element, imageAssetMap = new Map()) {
    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent.trim();

    switch (tagName) {
      case 'h1': {
        const { children, markDefs } = this.parseInlineElements(element);
        const block = {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h1',
          children
        };
        if (markDefs.length > 0) block.markDefs = markDefs;
        return block;
      }
      case 'h2': {
        const { children, markDefs } = this.parseInlineElements(element);
        const block = {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h2',
          children
        };
        if (markDefs.length > 0) block.markDefs = markDefs;
        return block;
      }
      case 'h3': {
        const { children, markDefs } = this.parseInlineElements(element);
        const block = {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h3',
          children
        };
        if (markDefs.length > 0) block.markDefs = markDefs;
        return block;
      }
      case 'h4': {
        const { children, markDefs } = this.parseInlineElements(element);
        const block = {
          _key: this.generateKey(),
          _type: 'block',
          style: 'h4',
          children
        };
        if (markDefs.length > 0) block.markDefs = markDefs;
        return block;
      }
      case 'p': {
        const { children, markDefs } = this.parseInlineElements(element);
        const block = {
          _key: this.generateKey(),
          _type: 'block',
          style: 'normal',
          children
        };
        if (markDefs.length > 0) block.markDefs = markDefs;
        return block;
      }
      case 'blockquote': {
        const { children, markDefs } = this.parseInlineElements(element);
        const block = {
          _key: this.generateKey(),
          _type: 'block',
          style: 'blockquote',
          children
        };
        if (markDefs.length > 0) block.markDefs = markDefs;
        return block;
      }
      case 'ul':
        return this.parseList(element, 'bullet', imageAssetMap);
      case 'ol':
        return this.parseList(element, 'number', imageAssetMap);
      case 'figure':
        // Handle WordPress caption figure elements
        if (element.hasAttribute('data-wp-caption')) {
          const img = element.querySelector('img');
          const figcaption = element.querySelector('figcaption');

          if (img) {
            const imgSrc = img.src || img.getAttribute('src');
            const assetId = imageAssetMap.get(imgSrc);

            if (!assetId) {
              console.warn(`Skipping figure with image without uploaded asset: ${imgSrc}`);
              return null;
            }

            const imageBlock = {
              _key: this.generateKey(),
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: assetId
              },
              alt: img.alt || '',
              caption: figcaption ? figcaption.textContent.trim() : (img.title || '')
            };

            // Extract and preserve width, height, and alignment from caption attributes
            const width = element.getAttribute('data-width');
            const height = element.getAttribute('data-height');
            const align = element.getAttribute('data-align');

            if (width) imageBlock.width = parseInt(width, 10);
            if (height) imageBlock.height = parseInt(height, 10);
            if (align) imageBlock.alignment = align.replace('align', ''); // aligncenter -> center

            return imageBlock;
          }
        }
        // For other figures, parse as container
        return this.parseElement(element, imageAssetMap);
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
      case 'hr':
        // Horizontal rule - convert to Portable Text horizontal rule block
        return {
          _key: this.generateKey(),
          _type: 'horizontalRule'
        };
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
          const { children, markDefs } = this.parseInlineElements(element);
          const block = {
            _key: this.generateKey(),
            _type: 'block',
            style: 'normal',
            children
          };
          if (markDefs.length > 0) block.markDefs = markDefs;
          return block;
        }
        return null;
    }
  }

  static parseInlineElements(element) {
    const children = [];
    const markDefs = [];

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
        const result = this.convertInlineElement(child, markDefs);
        if (result) {
          if (Array.isArray(result)) {
            children.push(...result);
          } else {
            children.push(result);
          }
        }
      }
    }

    const finalChildren = children.length > 0 ? children : [{
      _key: this.generateKey(),
      _type: 'span',
      text: '',
      marks: []
    }];

    return { children: finalChildren, markDefs };
  }

  static convertInlineElement(element, markDefs = [], inheritedMarks = []) {
    const tagName = element.tagName.toLowerCase();

    // Determine the mark for this element
    let currentMark = null;
    switch (tagName) {
      case 'strong':
      case 'b':
        currentMark = 'strong';
        break;
      case 'em':
      case 'i':
        currentMark = 'em';
        break;
      case 'code':
        currentMark = 'code';
        break;
      case 'a':
        const href = element.href;
        if (href) {
          // Create a unique key for this link markDef
          const markKey = this.generateKey();

          // Add the markDef to the array
          markDefs.push({
            _key: markKey,
            _type: 'link',
            href: href,
            blank: element.target === '_blank'
          });

          currentMark = markKey;
        }
        break;
    }

    // Combine inherited marks with current mark
    const marks = currentMark ? [...inheritedMarks, currentMark] : inheritedMarks;

    // Process children
    const children = [];
    for (const child of element.childNodes) {
      if (child.nodeType === 3) { // Text node
        const text = child.textContent;
        if (text) {
          children.push({
            _key: this.generateKey(),
            _type: 'span',
            text: text,
            marks: marks
          });
        }
      } else if (child.nodeType === 1) { // Element node
        // Recursively process nested inline elements with inherited marks
        const result = this.convertInlineElement(child, markDefs, marks);
        if (result) {
          if (Array.isArray(result)) {
            children.push(...result);
          } else {
            children.push(result);
          }
        }
      }
    }

    return children;
  }

  static parseList(listElement, listType, imageAssetMap = null) {
    const items = [];

    for (const child of listElement.children) {
      if (child.tagName.toLowerCase() === 'li') {
        const { children, markDefs } = this.parseInlineElements(child);
        const block = {
          _key: this.generateKey(),
          _type: 'block',
          style: 'normal',
          listItem: listType,
          children
        };
        if (markDefs.length > 0) block.markDefs = markDefs;
        items.push(block);
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