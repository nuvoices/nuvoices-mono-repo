const { JSDOM } = require('jsdom');

class ContentTransformer {
  static createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')
      .substring(0, 96);
  }

  static htmlToPortableText(html) {
    if (!html || html.trim() === '') {
      return [];
    }

    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const body = document.body;
      
      return this.parseElement(body);
    } catch (error) {
      console.error('Error converting HTML to Portable Text:', error);
      // Fallback: return as a single text block
      return [{
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: html.replace(/<[^>]*>/g, ''), // Strip HTML tags
          marks: []
        }]
      }];
    }
  }

  static parseElement(element) {
    const blocks = [];
    
    for (const child of element.childNodes) {
      if (child.nodeType === 3) { // Text node
        const text = child.textContent.trim();
        if (text) {
          blocks.push({
            _type: 'block',
            style: 'normal',
            children: [{
              _type: 'span',
              text: text,
              marks: []
            }]
          });
        }
      } else if (child.nodeType === 1) { // Element node
        const block = this.convertElementToBlock(child);
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
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '',
        marks: []
      }]
    }];
  }

  static convertElementToBlock(element) {
    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent.trim();

    switch (tagName) {
      case 'h1':
        return {
          _type: 'block',
          style: 'h1',
          children: this.parseInlineElements(element)
        };
      case 'h2':
        return {
          _type: 'block',
          style: 'h2',
          children: this.parseInlineElements(element)
        };
      case 'h3':
        return {
          _type: 'block',
          style: 'h3',
          children: this.parseInlineElements(element)
        };
      case 'h4':
        return {
          _type: 'block',
          style: 'h4',
          children: this.parseInlineElements(element)
        };
      case 'p':
        return {
          _type: 'block',
          style: 'normal',
          children: this.parseInlineElements(element)
        };
      case 'blockquote':
        return {
          _type: 'block',
          style: 'blockquote',
          children: this.parseInlineElements(element)
        };
      case 'ul':
        return this.parseList(element, 'bullet', imageAssetMap);
      case 'ol':
        return this.parseList(element, 'number', imageAssetMap);
      case 'img':
        return {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: `image-${this.createSlug(element.src || 'unknown')}`
          },
          alt: element.alt || '',
          caption: element.title || ''
        };
      case 'br':
        return null; // Ignore line breaks
      case 'div':
      case 'span':
        // Handle as container, parse children
        return this.parseElement(element);
      default:
        if (textContent) {
          return {
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