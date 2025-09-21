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

interface NewsPost {
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
}

const newsPostsQuery = groq`
  *[_type == "post" && status == "published" && "events" in categories[]->slug.current] | order(publishedAt desc) {
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
    }
  }
`;

export default async function NewsPage() {
  const newsPosts = await client.fetch<NewsPost[]>(newsPostsQuery);
  console.log(newsPosts)

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Main content */}
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        {/* Title section - matching magazine page dimensions */}
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            News
          </h1>
          <p className="text-[1.5625rem] font-serif italic leading-[1.1] tracking-[-0.047rem] text-black">
            Events, highlights and latest developments in this space
          </p>
        </div>

        {/* Articles Grid - using grid components */}
        <div className="w-full max-w-[45.1875rem] px-6">
          {newsPosts.length > 0 ? (
            <Grid>
              {/* Group news items into rows of 3 */}
              {Array.from({ length: Math.ceil(newsPosts.length / 3) }, (_, rowIndex) => (
                <GridRow key={rowIndex}>
                  {newsPosts.slice(rowIndex * 3, (rowIndex + 1) * 3).map((post, indexInRow) => (
                    <Article key={post._id} href={`/news/${post.slug.current}`}>
                      <ArticleImage
                        src={post.featuredImage?.asset?.url}
                        alt={post.featuredImage?.alt || post.title}
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
          ) : (
            <div className="text-center py-[6rem]">
              <p className="text-[#3c2e24] text-[1.5rem] font-serif mb-[1rem]">No news articles found.</p>
              <p className="text-[1rem] text-[#3c2e24] opacity-75">Make sure to create posts with the &quot;news&quot; category in Sanity Studio.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}