# Issue #5 Fix: Horizontal Rule Markers as Text

## Problem
WordPress content containing horizontal rule markers ("---") were being rendered as plain text paragraphs instead of proper horizontal rule elements.

## Solution Implemented

### 1. Preprocessing (transformers.js:157-167)
Added `preprocessHorizontalRules()` method that converts:
- `<p>---</p>` → `<hr />`
- `<p>  ---  </p>` (with spaces) → `<hr />`
- Standalone `---` at line boundaries → `<hr />`

### 2. HTML to Portable Text Conversion (transformers.js:475-480)
Added handler for `<hr>` elements in `convertElementToBlock()` that creates:
```javascript
{
  _key: generateKey(),
  _type: 'horizontalRule'
}
```

### 3. Sanity Schema (schemaTypes/)
Created new `horizontalRuleType` schema type and registered it:
- Created `horizontalRuleType.ts` with preview display
- Added to `index.ts` schema exports
- Added to post body field's `of` array in `postType.ts`

## Testing
Created comprehensive test suite (`test-horizontal-rules.js`) covering:
- Basic `<p>---</p>` conversion
- Whitespace handling
- Real-world examples from WordPress posts

**All tests passing ✅**

## Files Modified
1. `nuvoices-studio/import/transformers.js`
   - Lines 157-167: Preprocessing function
   - Line 239: Added to preprocessing chain
   - Lines 475-480: Block conversion handler

2. `nuvoices-studio/schemaTypes/horizontalRuleType.ts` (new file)
   - Defines horizontal rule schema type

3. `nuvoices-studio/schemaTypes/index.ts`
   - Line 7: Import statement
   - Line 17: Added to schema exports

4. `nuvoices-studio/schemaTypes/postType.ts`
   - Lines 117-119: Added to post body field

5. `nuvoices-studio/import/test-horizontal-rules.js` (new file)
   - Test suite for validation

## Next Steps for Re-import
When re-running the WordPress import:
1. The transformer will now automatically convert `---` to horizontal rules
2. Sanity Studio will display them with preview "— Horizontal Rule —"
3. Frontend rendering will need to handle the `horizontalRule` block type

## Frontend Implementation Required
In `nuvoices-web`, add a component to render horizontal rules:

```typescript
// In your Portable Text components
import { PortableTextComponents } from '@portabletext/react'

const components: PortableTextComponents = {
  types: {
    horizontalRule: () => <hr className="my-8 border-t-2 border-gray-300" />,
    // ... other types
  }
}
```
