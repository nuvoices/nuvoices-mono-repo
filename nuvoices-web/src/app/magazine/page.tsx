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
import ActionButton from "@/components/ActionButton";

interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description?: string;
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
  *[_type == "post" && status == "published" && "magazine" in categories[]->slug.current] | order(publishedAt desc) {
    _id,
    title,
    slug,
    description,
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

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Main content */}
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        {/* Title section - 369px height = 11.531rem, 1234px width = 38.5625rem */}
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            NüVoices Magazine
          </h1>
          <p className="text-[1.5625rem] font-serif italic leading-[1.1] tracking-[-0.047rem] text-black mb-[1.25rem]">
            A magazine of ideas from minority voices on China subjects
          </p>
        </div>

        {/* Articles Grid - 1446px = 45.1875rem width, 606px = 18.9375rem height per row */}
        <Content>
          {posts.length > 0 ? (
            <Grid>
              <GridRow>
                {posts.map((post, index) => (
                  <Article key={post._id} href={`/magazine/${post.slug.current}`}>
                    <ArticleImage
                      src={post.featuredImage?.asset?.url}
                      alt={post.featuredImage?.alt || post.title}
                      rotation={index % 2 === 0 ? 'left' : 'right'}
                    />
                    <ArticleContent>
                      <ArticleTitle>{post.title}</ArticleTitle>
                      {post.description && <ArticleExcerpt>{post.description}</ArticleExcerpt>}
                      <ArticleDate date={post.publishedAt} />
                    </ArticleContent>
                  </Article>
                ))}
              </GridRow>
            </Grid>
          ) : (
            <div className="text-center py-[6rem]">
              <p className="text-[#3c2e24] text-[1.5rem] font-serif mb-[1rem]">No magazine articles found.</p>
              <p className="text-[1rem] text-[#3c2e24] opacity-75">Make sure to create posts with the &quot;featuredstories&quot; category in Sanity Studio.</p>
            </div>
          )}
        </Content>
      </main>
    </div>
  );
}