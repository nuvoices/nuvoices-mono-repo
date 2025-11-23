# Exclude Featured Post from Category Sections

## Problem
The home page fetches a featured post and three posts each for Magazine, Podcast, and News sections. Currently, the featured post can appear again in category sections, causing duplication.

## Solution
Use GROQ filtering to exclude the featured post from category queries.

## Design

### Query Structure
1. Fetch featured post first (sequential)
2. Build category queries with `_id != featuredPost._id` filter
3. Fetch all three category sections in parallel

### Implementation Details

**Step 1: Fetch Featured Post**
```typescript
const featuredPost = await client.fetch<Post | null>(featuredPostQuery)
```

**Step 2: Build Dynamic Category Queries**
Add conditional filter to each category query:
```groq
*[_type == "post" && status == "published"
  && "category" in categories[]->slug.current
  && _id != "featured-post-id"
] | order(publishedAt desc) [0...3]
```

**Step 3: Parallel Category Fetching**
```typescript
const [magazinePosts, podcastPosts, newsPosts] = await Promise.all([
  client.fetch<Post[]>(magazineQueryWithExclusion),
  client.fetch<Post[]>(podcastQueryWithExclusion),
  client.fetch<Post[]>(newsQueryWithExclusion),
])
```

### Trade-offs
- **Pro**: Clean, query-level filtering
- **Pro**: Guarantees exactly 3 unique posts per section
- **Pro**: No client-side filtering complexity
- **Con**: Sequential fetch adds ~50-100ms (featured → categories)
- **Con**: Slightly more complex query construction

## Alternatives Considered

**Option 2: Client-side filtering**
- Fetch 4 posts per category, filter in JavaScript
- Risk of inconsistent post counts (2-4 posts per section)

**Option 3: GROQ subquery**
- Exclude latest post directly in GROQ
- Timing issues if featured post changes between queries
