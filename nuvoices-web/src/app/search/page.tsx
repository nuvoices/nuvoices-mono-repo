import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import {
  Grid,
  GridRow,
  Article,
  ArticleContent,
  ArticleImage,
  ArticleTitle,
  ArticleExcerpt,
  ArticleDate,
} from "@/components/ui/grid";
import { Content } from "@/components/ui/Content";

interface SearchPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
  publishedAt: string;
  featuredImage?: {
    asset?: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  author?: {
    name: string;
  };
  categories?: Array<{
    slug: {
      current: string;
    };
  }>;
}

function getPostHref(post: SearchPost): string {
  const categorySlugs = post.categories?.map((c) => c.slug.current) ?? [];
  if (categorySlugs.includes("magazine")) return `/magazine/${post.slug.current}`;
  if (categorySlugs.includes("podcast")) return `/podcast/${post.slug.current}`;
  if (categorySlugs.includes("news")) return `/news/${post.slug.current}`;
  // Fallback to magazine if no known category
  return `/magazine/${post.slug.current}`;
}

const searchQuery = groq`
  *[_type == "post" && status == "published" && (
    title match $term ||
    excerpt match $term ||
    pt::text(body) match $term
  )] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    featuredImage {
      asset->{
        _id,
        url
      },
      alt
    },
    author->{
      name
    },
    categories[]->{
      slug
    }
  }
`;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let posts: SearchPost[] = [];
  if (query) {
    // Sanity match operator works with wildcarded terms
    posts = await client.fetch<SearchPost[]>(searchQuery, {
      term: `${query}*`,
    });
  }

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        {/* Title section */}
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            Search
          </h1>
          {query && (
            <p className="text-[1.125rem] font-serif italic leading-[1.4] text-[#3c2e24]/70">
              {posts.length} {posts.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Results */}
        <Content>
          {!query ? (
            <div className="text-center py-[3rem]">
              <p className="text-[#3c2e24]/60 text-[1.125rem] font-serif italic">
                Enter a search term to find articles.
              </p>
            </div>
          ) : posts.length > 0 ? (
            <Grid>
              <GridRow>
                {posts.map((post, index) => (
                  <Article key={post._id} href={getPostHref(post)}>
                    <ArticleImage
                      src={post.featuredImage?.asset?.url}
                      alt={post.featuredImage?.alt || post.title}
                      rotation={index % 2 === 0 ? "left" : "right"}
                    />
                    <ArticleContent>
                      <ArticleTitle>{post.title}</ArticleTitle>
                      {post.excerpt && (
                        <ArticleExcerpt>{post.excerpt}</ArticleExcerpt>
                      )}
                      <ArticleDate date={post.publishedAt} />
                    </ArticleContent>
                  </Article>
                ))}
              </GridRow>
            </Grid>
          ) : (
            <div className="text-center py-[3rem]">
              <p className="text-[#3c2e24] text-[1.25rem] font-serif mb-[0.75rem]">
                No results found.
              </p>
              <p className="text-[#3c2e24]/60 text-[1rem] font-serif italic">
                Try a different search term or browse our sections.
              </p>
            </div>
          )}
        </Content>
      </main>
    </div>
  );
}
