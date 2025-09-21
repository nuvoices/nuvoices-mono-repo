# Grid Component Library

This directory contains a reusable grid component library for magazine-style article layouts, following a modular architecture similar to shadcn/ui.

## Component Overview

### Core Components

#### Grid & GridRow
Container components that provide the layout structure.

```tsx
import { Grid, GridRow } from '@/components/ui/grid';

<Grid>
  <GridRow>
    {/* Article components go here */}
  </GridRow>
</Grid>
```

- **Grid**: Main container with vertical spacing between rows (gap: 0.9375rem)
- **GridRow**: Horizontal container for articles (gap: 0.313rem, max 3 items)

#### Article
Wrapper component that handles the link and article container.

```tsx
import { Article, ArticleContent } from '@/components/ui/grid';

<Article href="/magazine/article-slug">
  <ArticleImage ... />
  <ArticleContent>
    <ArticleTitle>Title</ArticleTitle>
    <ArticleExcerpt>Description</ArticleExcerpt>
    <ArticleDate date={publishedAt} />
  </ArticleContent>
</Article>
```

- **Article**: Link wrapper with no text decoration, fixed width (14.813rem)
- **ArticleContent**: Container for text content with proper spacing

#### ArticleImage
Image component with rotation support for visual variety.

```tsx
import { ArticleImage } from '@/components/ui/grid';

<ArticleImage
  src={imageUrl}
  alt="Description"
  rotation="left" // 'left' | 'right' | 'none'
/>
```

- Dimensions: 13.25rem × 10.188rem
- Rotation: -2deg (left), 2deg (right), or none
- Includes hover scale effect
- Shows placeholder when no image available

#### Typography Components

```tsx
import { ArticleTitle, ArticleExcerpt, ArticleDate } from '@/components/ui/grid';

<ArticleTitle>Article Title</ArticleTitle>
<ArticleExcerpt>Brief description text</ArticleExcerpt>
<ArticleDate date="2024-01-15" />
```

- **ArticleTitle**: Large serif heading (1.5625rem) with no margins
- **ArticleExcerpt**: Small italic serif text (0.688rem) with 2-line clamp
- **ArticleDate**: Formatted date display (0.688rem)

## Design Specifications

### Typography
- Title: 1.5625rem (25px), serif, tracking -0.047rem
- Excerpt: 0.688rem (11px), serif italic
- Date: 0.688rem (11px), serif
- Color: #3c2e24 (dark brown)

### Layout
- Grid gap: 0.9375rem (15px) vertical
- Row gap: 0.313rem (5px) horizontal
- Article width: 14.813rem (237px)
- Image dimensions: 13.25rem × 10.188rem (212px × 163px)
- Content gap: 0.313rem (5px)

### Styling Notes
- Background: #f4ecea (cream)
- All measurements use rem units (32px = 1rem conversion)
- No underlines on links (text-decoration: none)
- Hover effects on images (scale 1.05)
- Alternating image rotation for visual interest

## Usage Example

```tsx
import {
  Grid,
  GridRow,
  Article,
  ArticleContent,
  ArticleImage,
  ArticleTitle,
  ArticleExcerpt,
  ArticleDate
} from '@/components/ui/grid';

export default function MagazinePage() {
  const posts = await fetchPosts(); // Your data fetching

  return (
    <Grid>
      {Array.from({ length: Math.ceil(posts.length / 3) }, (_, rowIndex) => (
        <GridRow key={rowIndex}>
          {posts.slice(rowIndex * 3, (rowIndex + 1) * 3).map((post, indexInRow) => (
            <Article key={post._id} href={`/magazine/${post.slug}`}>
              <ArticleImage
                src={post.featuredImage?.url}
                alt={post.title}
                rotation={indexInRow % 2 === 0 ? 'left' : 'right'}
              />
              <ArticleContent>
                <ArticleTitle>{post.title}</ArticleTitle>
                {post.excerpt && <ArticleExcerpt>{post.excerpt}</ArticleExcerpt>}
                <ArticleDate date={post.publishedAt} />
              </ArticleContent>
            </Article>
          ))}
        </GridRow>
      ))}
    </Grid>
  );
}
```

## Component Props

### Grid
- `children`: React.ReactNode
- `className?`: string (optional additional classes)

### GridRow
- `children`: React.ReactNode
- `className?`: string

### Article
- `href`: string (required - link destination)
- `children`: React.ReactNode
- `className?`: string

### ArticleContent
- `children`: React.ReactNode
- `className?`: string

### ArticleImage
- `src?`: string (image URL, optional)
- `alt`: string (required for accessibility)
- `rotation?`: 'left' | 'right' | 'none' (default: 'none')
- `className?`: string

### ArticleTitle
- `children`: React.ReactNode
- `className?`: string

### ArticleExcerpt
- `children`: React.ReactNode
- `className?`: string

### ArticleDate
- `date`: string | Date (will be formatted to "Month Day, Year")
- `className?`: string

## File Structure

```
src/components/ui/grid/
├── index.ts          # Barrel exports
├── Grid.tsx          # Grid and GridRow components
├── Article.tsx       # Article and ArticleContent components
├── ArticleImage.tsx  # Image component with rotation
├── ArticleTitle.tsx  # Title and Excerpt components
├── ArticleDate.tsx   # Date formatter component
└── CLAUDE.md         # This documentation
```

## Integration with Sanity CMS

The components are designed to work with Sanity CMS data structure:

```typescript
interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt: string;
  featuredImage?: {
    asset?: { url: string };
    alt?: string;
  };
}
```

## Maintenance Notes

- Components use Tailwind CSS with custom values matching Figma design
- All components accept optional `className` prop for extensibility
- Image rotation alternates based on position in row for visual variety
- Date formatting uses browser's locale for internationalization
- Components are fully typed with TypeScript for type safety