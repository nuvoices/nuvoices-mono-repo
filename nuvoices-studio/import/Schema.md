# WordPress XML Export Schema

This document describes the data structure and schema of different content types found in the `nuvoices.xml` WordPress export file.

## Site Information
- **Site URL**: https://nuvoices.com
- **WordPress Version**: 6.8.1
- **Export Date**: 2025-07-21 08:20
- **Language**: en-US

## Data Types

### 1. Authors (`wp:author`)
Contains information about WordPress users who created content.

**Fields:**
- `wp:author_id` - Unique numeric ID
- `wp:author_login` - Username/login
- `wp:author_email` - Email address
- `wp:author_display_name` - Display name
- `wp:author_first_name` - First name
- `wp:author_last_name` - Last name

**Example:**
```xml
<wp:author>
  <wp:author_id>1</wp:author_id>
  <wp:author_login><![CDATA[joannachiu]]></wp:author_login>
  <wp:author_email><![CDATA[storywithoutend@gmail.com]]></wp:author_email>
  <wp:author_display_name><![CDATA[NüVoices]]></wp:author_display_name>
  <wp:author_first_name><![CDATA[Joanna]]></wp:author_first_name>
  <wp:author_last_name><![CDATA[Chiu]]></wp:author_last_name>
</wp:author>
```

### 2. Categories (`wp:category`)
Hierarchical taxonomy for organizing content.

**Fields:**
- `wp:term_id` - Unique numeric ID
- `wp:category_nicename` - URL-friendly slug
- `wp:category_parent` - Parent category slug (empty for top-level)
- `wp:cat_name` - Display name
- `wp:category_description` - Optional description

**Example:**
```xml
<wp:category>
  <wp:term_id>30</wp:term_id>
  <wp:category_nicename><![CDATA[featured-stories]]></wp:category_nicename>
  <wp:category_parent><![CDATA[]]></wp:category_parent>
  <wp:cat_name><![CDATA[NüStories Magazine]]></wp:cat_name>
  <wp:category_description><![CDATA[NüStories is a magazine of ideas that aims to highlight minority voices on China subjects]]></wp:category_description>
</wp:category>
```

**Key Categories:**
- Books (672)
- Events (29)
- JOB (711)
- NüStories Magazine (30) - Main content category
  - Opinion (74)
  - Personal Essay (89)
  - Photography (358)
  - Profiles (32)
  - Q&A (38)
  - Translation (110)
  - Travel (62)
  - Art (56)
  - Essay (33)
  - Fiction (34)
  - Film (510)
- Podcast (35)
- Uncategorized (1)

### 3. Tags (`wp:tag`)
Non-hierarchical taxonomy for content labeling.

**Fields:**
- `wp:term_id` - Unique numeric ID
- `wp:tag_slug` - URL-friendly slug
- `wp:tag_name` - Display name

**Example:**
```xml
<wp:tag>
  <wp:term_id>137</wp:term_id>
  <wp:tag_slug><![CDATA[little-people]]></wp:tag_slug>
  <wp:tag_name><![CDATA["little people"]]></wp:tag_name>
</wp:tag>
```

### 4. Posts (`item` with `wp:post_type` = `post`)
Main content entries - articles, stories, etc.

**Standard Fields:**
- `title` - Post title
- `link` - Permalink URL
- `pubDate` - Publication date (RSS format)
- `dc:creator` - Author username
- `guid` - Unique identifier
- `description` - Post excerpt
- `content:encoded` - Full post content (HTML)
- `excerpt:encoded` - Manual excerpt

**WordPress-Specific Fields:**
- `wp:post_id` - Unique numeric ID
- `wp:post_date` - Publication date (YYYY-MM-DD HH:MM:SS)
- `wp:post_date_gmt` - Publication date in GMT
- `wp:post_modified` - Last modified date
- `wp:post_modified_gmt` - Last modified date in GMT
- `wp:comment_status` - Comment settings (open/closed)
- `wp:ping_status` - Pingback settings (open/closed)
- `wp:post_name` - URL slug
- `wp:status` - Post status (publish/draft/inherit)
- `wp:post_parent` - Parent post ID (0 for none)
- `wp:menu_order` - Menu ordering
- `wp:post_type` - Content type (post/page/attachment)
- `wp:post_password` - Password protection
- `wp:is_sticky` - Sticky post flag (0/1)

**Taxonomies:**
- `category` entries with domain="category" or domain="post_tag"

**Custom Fields:**
- `wp:postmeta` - Custom field key-value pairs

**Example:**
```xml
<item>
  <title><![CDATA[Article Title]]></title>
  <link>https://nuvoices.com/article-slug/</link>
  <pubDate>Thu, 21 May 2020 15:41:35 +0000</pubDate>
  <dc:creator><![CDATA[joannachiu]]></dc:creator>
  <content:encoded><![CDATA[<p>Article content...</p>]]></content:encoded>
  <wp:post_id>2094</wp:post_id>
  <wp:post_type><![CDATA[post]]></wp:post_type>
  <wp:status><![CDATA[publish]]></wp:status>
  <category domain="category" nicename="featured-stories"><![CDATA[NüStories Magazine]]></category>
  <category domain="post_tag" nicename="china"><![CDATA[China]]></category>
</item>
```

### 5. Attachments (`item` with `wp:post_type` = `attachment`)
Media files (images, documents, etc.).

**Additional Fields:**
- `wp:attachment_url` - Direct URL to media file
- `wp:postmeta` with key `_wp_attached_file` - File path
- `wp:postmeta` with key `_wp_attachment_metadata` - Serialized metadata (dimensions, thumbnails, etc.)

### 6. Custom Fields (`wp:postmeta`)
Key-value pairs for additional post data.

**Structure:**
- `wp:meta_key` - Field name
- `wp:meta_value` - Field value

**Common Keys:**
- `_edit_last` - Last editor user ID
- `_wp_attached_file` - Attachment file path
- `_wp_attachment_metadata` - Image/media metadata
- `_webdados_fb_open_graph_specific_image` - Facebook Open Graph image
- `_webdados_fb_open_graph_specific_description` - Facebook Open Graph description

## Content Statistics
The export contains various content types including articles, images, podcasts, and other media files spanning from 2018 to 2025, primarily focused on Chinese culture, diaspora experiences, and minority voices.