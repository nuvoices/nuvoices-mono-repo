# Issue #6: `<b>` Tags Being Converted to `<p>` Tags

## Problem Description

Post #141 ("Virtual events for Te-Ping Chen's story collection, Land of Big Numbers") had an issue where `<b>` (bold) tags were being converted to separate paragraph blocks instead of being rendered as inline bold text with `<strong>` marks.

### Symptoms

1. **Each `<b>` tag became a separate paragraph** - Content that should flow inline was split into multiple blocks
2. **Bold formatting was lost** - The "strong" mark was not being applied to the text

### Example

**WordPress XML:**
```html
<div><b>A Most Anticipated Title of 2021 from <i>Esquire </i></b>· <b><i>Elle </i></b>· <b><i>O Magazine </i></b></div>
```

**Before Fix:**
- 5 separate paragraph blocks
- "Esquire", "Elle", "O Magazine" only had "em" marks (from `<i>` tags)
- No "strong" marks applied
- Plain text "·" became separate paragraphs

**After Fix:**
- 1 paragraph block containing 6 spans
- Proper marks applied:
  - "A Most Anticipated Title of 2021 from " → `[strong]`
  - "Esquire " → `[strong, em]`
  - "· " → `[]`
  - "Elle " → `[strong, em]`
  - "· " → `[]`
  - "O Magazine " → `[strong, em]`

## Root Cause

The transformer had two main issues:

1. **`parseElement` created separate blocks for each inline element** - When encountering inline elements like `<b>`, `<i>`, etc. as direct children of block containers, it treated each as a separate block instead of merging consecutive inline content.

2. **`convertInlineElement` didn't preserve marks when processing children** - When a `<b>` tag was converted to a block, the bold mark was lost because the method only applied marks when there was direct text content, not when processing nested elements.

## Solution

### 1. Enhanced `parseElement` to Merge Consecutive Inline Content

Modified `nuvoices-studio/import/transformers.js:265-326` to:
- Detect consecutive inline content (text nodes + inline elements like `<b>`, `<i>`, `<em>`, `<strong>`, `<code>`, `<a>`)
- Collect them into an `inlineBuffer`
- Merge them into a single paragraph block using `createParagraphFromInlineContent()`
- Flush the buffer when encountering block-level elements

### 2. Created `createParagraphFromInlineContent` Helper Method

Added new method at `nuvoices-studio/import/transformers.js:328-368` to:
- Process a sequence of inline nodes (text nodes and inline elements)
- Preserve marks and markDefs (for links)
- Create a proper paragraph block with all inline content merged

### 3. Fixed `convertInlineElement` to Handle Nested Inline Elements

Refactored `nuvoices-studio/import/transformers.js:653-719` to:
- Accept `inheritedMarks` parameter to preserve marks from parent elements
- Recursively process nested inline elements (e.g., `<b><i>text</i></b>`)
- Properly combine marks (e.g., both "strong" and "em" for nested `<b><i>`)
- Always return an array of children instead of a single span

## Files Modified

- `nuvoices-studio/import/transformers.js`
  - Lines 265-326: Enhanced `parseElement()` method
  - Lines 328-368: New `createParagraphFromInlineContent()` method
  - Lines 653-719: Refactored `convertInlineElement()` method

## Testing

Verified the fix handles:
- ✅ Nested inline elements (e.g., `<b><i>text</i></b>`)
- ✅ Multiple consecutive inline elements (e.g., `<b>Bold</b> <i>Italic</i>`)
- ✅ Block followed by inline (e.g., `<p>Para</p><b>Bold</b>`)
- ✅ Links with formatting (e.g., `<b><a href="...">Bold link</a></b>`)
- ✅ Plain inline elements (e.g., `<b>Just bold</b>`)
- ✅ Whitespace between inline elements preserved

## Impact

This fix affects all posts with inline elements that are not wrapped in `<p>` tags, particularly those with:
- Bold text (`<b>` or `<strong>`)
- Italic text (`<i>` or `<em>`)
- Code snippets (`<code>`)
- Links (`<a>`)
- Any combination of the above

The fix ensures that inline formatting is preserved and content flows naturally as single paragraphs instead of being fragmented into multiple blocks.

## Related Issues

This issue is related to Issue #1 (Inline Content Rendered as Block Paragraphs) but addresses a different aspect:
- **Issue #1**: Orphan text nodes not wrapped in `<p>` tags
- **Issue #6**: Inline elements (`<b>`, `<i>`, etc.) not properly merged into paragraphs
