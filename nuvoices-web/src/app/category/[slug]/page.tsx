export const runtime = 'edge';

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
import { SUBCATEGORY_PRIORITY } from "@/lib/categories";

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt: string;
  featuredImage?: {
    asset?: { _id: string; url: string };
    alt?: string;
  };
  author?: { name: string };
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const categoryPostsQuery = groq`
  *[_type == "post" && status == "published" && $slug in categories[]->slug.current] | order(publishedAt desc) {
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

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const posts = await client.fetch<Post[]>(categoryPostsQuery, { slug });

  const matched = SUBCATEGORY_PRIORITY.find((s) => s.slug === slug);
  const title = matched
    ? matched.title
    : slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            {title}
          </h1>
        </div>

        <Content>
          {posts.length > 0 ? (
            <Grid>
              <GridRow>
                {posts.map((post, index) => (
                  <Article key={post._id} href={`/magazine/${post.slug.current}`}>
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
            <div className="text-center py-[6rem]">
              <p className="text-[#3c2e24] text-[1.5rem] font-serif">
                No posts found.
              </p>
            </div>
          )}
        </Content>
      </main>
    </div>
  );
}
