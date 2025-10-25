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
import { Container } from "@/components/ui/Container";

interface Post {
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

const magazinePostsQuery = groq`
  *[_type == "post" && status == "published" && "featuredstories" in categories[]->slug.current] | order(publishedAt desc) {
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

export default async function MagazinePage() {
  const posts = await client.fetch<Post[]>(magazinePostsQuery);
  console.log(posts)

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Main content */}
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        {/* Title section - 369px height = 11.531rem, 1234px width = 38.5625rem */}
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            NüStories
          </h1>
          <p className="text-[1.5625rem] font-serif italic leading-[1.1] tracking-[-0.047rem] text-black mb-[1.25rem]">
            A magazine of ideas from minority voices on China subjects
          </p>
          <a
            href="/submissions"
            className="inline-block px-[2.5rem] py-[0.75rem] bg-[#3c2e24] text-[#f5f4f1] font-sans font-extrabold uppercase text-[0.781rem] leading-[1.1] rounded-[0.313rem] hover:bg-opacity-90 transition no-underline"
          >
            SUBMISSIONS
          </a>
        </div>

        {/* Articles Grid - 1446px = 45.1875rem width, 606px = 18.9375rem height per row */}
        <Container>
          {posts.length > 0 ? (
            <Grid>
              {/* Group posts into rows of 3 */}
              {Array.from({ length: Math.ceil(posts.length / 3) }, (_, rowIndex) => (
                <GridRow key={rowIndex}>
                  {posts.slice(rowIndex * 3, (rowIndex + 1) * 3).map((post, indexInRow) => (
                    <Article key={post._id} href={`/magazine/${post.slug.current}`}>
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
              <p className="text-[#3c2e24] text-[1.5rem] font-serif mb-[1rem]">No magazine articles found.</p>
              <p className="text-[1rem] text-[#3c2e24] opacity-75">Make sure to create posts with the &quot;featuredstories&quot; category in Sanity Studio.</p>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}