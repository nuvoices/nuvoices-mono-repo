# Issue #7: Gallery Shortcode Fix

**Date:** 2025-11-02
**Status:** ✅ FIXED

## Problem

WordPress gallery shortcodes were appearing as plain text in the imported content instead of being converted to proper image galleries.

### Affected Posts

**3 posts total** contain gallery shortcodes:

1. **Post #43** (wp_post_id: 1209): "WATCH: Over 80 attend NüVoices London launch wanel..."
   - 2 galleries with 7 images total
   - Gallery 1: `[gallery columns="2" ids="1215,1302,1298,1311"]` (4 images)
   - Gallery 2: `[gallery ids="1216,1221,1305"]` (3 images)

2. **Post #53** (wp_post_id: 1365): "Carving out Chinese ideals of female beauty..."
   - 1 gallery with 6 images
   - Gallery 1: `[gallery columns="2" ids="1373,1372,1371,1370,1369,1368"]`

3. **Post #59** (wp_post_id: 1488): "Full house of 70+ welcome board member and author Karoline Kan..."
   - 1 gallery with 6 images
   - Gallery 1: `[gallery columns="1" ids="1520,1524,1519,1521,1523,1522"]`

## Solution

Created a preprocessing function `preprocessGalleries()` that:

1. Parses gallery shortcodes to extract image IDs
2. Looks up attachment URLs from the WordPress XML attachments data
3. Converts each gallery to a series of `<figure>` elements (vertically stacked)
4. Each figure contains an `<img>` tag with the full-size image URL and a `<figcaption>` with the image title

### Gallery Conversion Format

**Input:**
```
[gallery columns="2" ids="1215,1302,1298,1311"]
```

**Output:**
```html
<figure class="wp-gallery-image">
  <img src="https://nuvoices.com/wp-content/uploads/2019/04/IMG_7698-min.jpg"
       alt="Xiao Meili. Photo Credit: Antonio Wan">
  <figcaption>Xiao Meili. Photo Credit: Antonio Wan</figcaption>
</figure>
<figure class="wp-gallery-image">
  <img src="https://nuvoices.com/wp-content/uploads/2019/04/IMG_7756-min.jpg"
       alt="Lijia Zhang. Photo Credit: Antonio Wan">
  <figcaption>Lijia Zhang. Photo Credit: Antonio Wan</figcaption>
</figure>
<!-- ... more figures for remaining images -->
```

### Design Decision: Vertical Layout

Gallery images are displayed **vertically** (one per row) rather than in a grid because:

1. **Simplicity**: Easier to implement and maintain
2. **Consistency**: Matches the single-column content layout
3. **Responsive**: Works well on all screen sizes without complex layout logic
4. **Accessibility**: Better for screen readers and keyboard navigation
5. **Source Images**: Uses full-size source images for better quality

## Implementation

### Files Modified

1. **`transformers.js`** - Added `preprocessGalleries()` method (lines 232-281)
   - Parses gallery shortcodes using regex
   - Extracts image IDs from the `ids` attribute
   - Looks up attachments using the attachmentMap
   - Generates figure/img/figcaption HTML for each image
   - Returns HTML with galleries replaced by vertical image stacks

2. **`transformers.js`** - Updated `htmlToPortableText()` signature (line 283)
   - Added `attachmentMap` parameter
   - Calls `preprocessGalleries()` before other preprocessing steps (line 291)

3. **`importPosts.js`** - Updated transformer call (line 354)
   - Passes `attachmentMap` to `htmlToPortableText()`

### Test Results

**Test file:** `test-gallery-fix.js`

**Results:**
- ✓ All 3 posts with galleries detected
- ✓ All 19 gallery images found in attachments
- ✓ All gallery shortcodes successfully converted (0 remaining)
- ✓ 19 figure elements created
- ✓ Images use full-size source URLs
- ✓ Captions properly extracted from attachment titles

## Image Details

### Post #43 Gallery Images

**Gallery 1 (Panel Speakers):**
- 1215: Xiao Meili. Photo Credit: Antonio Wan (IMG_7698-min.jpg)
- 1302: Lijia Zhang. Photo Credit: Antonio Wan (IMG_7756-min.jpg)
- 1298: Sophia Huang Xueqin. Photo Credit: Antonio Wan (IMG_7717-min.jpg)
- 1311: Panel. Photo Credit: Antonio Wan (IMG_7654-min.jpg)

**Gallery 2 (Audience):**
- 1216: Audience. Photo Credit: Antonio Wan (IMG_7751-min.jpg)
- 1221: Audience. Photo Credit: Antonio Wan (IMG_7774-min.jpg)
- 1305: Audience. Photo Credit: Antonio Wan (IMG_7792-min.jpg)

### Post #53 Gallery Images

**Gallery 1 (Less Icon Series):**
- 1373-1368: Artist Su Yang's "Less Icon Series" self-portraits

### Post #59 Gallery Images

**Gallery 1 (Event Photos):**
- 1520-1522: Karoline Kan book launch event photos

## Benefits

1. **Full Resolution**: Uses source images instead of WordPress thumbnails
2. **Proper Structure**: Images are proper Portable Text image blocks with captions
3. **Reusable**: Works for any gallery shortcode format
4. **Maintainable**: Clean, well-documented preprocessing function
5. **Extensible**: Easy to modify layout or styling in the future

## Next Steps

- ✅ Function implemented and tested
- ⏳ Re-import posts #43, #53, and #59 with gallery fix
- ⏳ Visual QA to verify gallery images render correctly in the web app
- ⏳ Update CONTENT_QA.md to reflect gallery issue resolution

## Related Issues

- **Issue #2**: WordPress caption shortcodes (already fixed)
- **Post #43**: Previously marked with gallery shortcode issue
- **Post #53**: Not yet reviewed in visual QA (marked as "⏳ Pending Review")
