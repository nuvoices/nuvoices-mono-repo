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
  ArticleDate
} from '@/components/ui/grid';

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

// Query to get latest 3 magazine posts
const magazinePostsQuery = groq`
  *[_type == "post" && status == "published" && "featuredstories" in categories[]->slug.current] | order(publishedAt desc) [0...3] {
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

// Query to get latest 3 podcast posts
const podcastPostsQuery = groq`
  *[_type == "post" && status == "published" && "podcast" in categories[]->slug.current] | order(publishedAt desc) [0...3] {
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

// Query to get the most recent featured post
const featuredPostQuery = groq`
  *[_type == "post" && status == "published"] | order(publishedAt desc) [0] {
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

const img847PxCabCallowayGottlieb18 = "http://localhost:3845/assets/dea6d5963562ca3f7428c30f3d53593f4e6a4f41.png";
const img847PxCabCallowayGottlieb19 = "http://localhost:3845/assets/6b3cef217f04cde54161c430dbaa4803a7dbdebe.png";
const img2062PxEthelWatersWilliamP4 = "http://localhost:3845/assets/ed4b63a872fe5c274cadc8e98c5773640f829db5.png";

export default async function Home() {
  // Fetch posts from Sanity
  const [magazinePosts, podcastPosts, featuredPost] = await Promise.all([
    client.fetch<Post[]>(magazinePostsQuery),
    client.fetch<Post[]>(podcastPostsQuery),
    client.fetch<Post | null>(featuredPostQuery)
  ]);
  return (
    <div className="bg-[#f4ecea] flex flex-col gap-[1.563rem] items-center min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full max-w-[45rem] mx-auto">
        <div className="flex flex-col items-center gap-[1.563rem] pt-[1.563rem]">
          {/* Logo placeholder - 270px x 354px */}
          <div className="w-[8.438rem] h-[11.063rem] relative">
            <img
              src="/nuvoices-logo.png"
              alt="NüVoices Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Tagline - 110px = 3.438rem */}
          <div className="font-serif text-[3.438rem] leading-[1.2] text-[#3c2e24] text-center tracking-[-0.103rem] max-w-[38.844rem]">
            Amplifying the voices of women and minority experts on China
          </div>

          {/* Buttons - 252px x 99px, 35px text */}
          <div className="flex gap-[0.938rem]">
            <a href="/join" className="bg-[#3c2e24] rounded-[0.313rem] w-[7.875rem] h-[3.094rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg no-underline hover:no-underline border-0">
              <span className="font-sans font-extrabold text-[1.094rem] text-[#f5f4f1] uppercase">JOIN</span>
            </a>
            <button className="bg-[#3c2e24] rounded-[0.313rem] w-[7.875rem] h-[3.094rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg border-0">
              <span className="font-sans font-extrabold text-[1.094rem] text-[#f5f4f1] uppercase">DONATE</span>
            </button>
            <a href="/explore" className="bg-[#3c2e24] rounded-[0.313rem] w-[7.875rem] h-[3.094rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg no-underline hover:no-underline border-0">
              <span className="font-sans font-extrabold text-[1.094rem] text-[#f5f4f1] uppercase">EXPLORE</span>
            </a>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {featuredPost && (
        <div className="flex flex-col gap-[0.938rem] items-center w-full">
          <div className="font-sans font-semibold text-[1.25rem] text-black text-center">
            Featured Content
          </div>
          <a href={`/magazine/${featuredPost.slug.current}`} className="flex flex-col gap-[0.625rem] items-center w-full max-w-[45rem] no-underline hover:no-underline">
            {featuredPost.featuredImage?.asset?.url && (
              <div className="h-[18.75rem] w-full relative">
                <img
                  src={featuredPost.featuredImage.asset.url}
                  alt={featuredPost.featuredImage.alt || featuredPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="font-serif text-[1.875rem] text-[#3c2e24] text-center tracking-[-0.056rem]">
              {featuredPost.title}
            </div>
            <div className="font-serif italic text-[0.938rem] text-[#3c2e24] text-center">
              {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </a>
        </div>
      )}

      {/* Magazine Section */}
      {magazinePosts.length > 0 && (
        <div className="flex flex-col gap-[0.938rem] items-center w-full">
          <div className="font-sans font-semibold text-[1.25rem] text-[#3c2e24] text-center">
            Magazine
          </div>
          <Grid className="w-full max-w-[45.188rem] px-3">
            <GridRow>
              {magazinePosts.map((post, index) => (
                <Article key={post._id} href={`/magazine/${post.slug.current}`}>
                  <ArticleImage
                    src={post.featuredImage?.asset?.url}
                    alt={post.featuredImage?.alt || post.title}
                    rotation={index % 2 === 0 ? 'left' : 'right'}
                  />
                  <ArticleContent>
                    <ArticleTitle>{post.title}</ArticleTitle>
                    {post.excerpt && <ArticleExcerpt>{post.excerpt}</ArticleExcerpt>}
                    <ArticleDate date={post.publishedAt} />
                  </ArticleContent>
                </Article>
              ))}
            </GridRow>
          </Grid>
        </div>
      )}

      {/* Podcast Section */}
      {podcastPosts.length > 0 && (
        <div className="flex flex-col gap-[0.938rem] items-center w-full">
          <div className="font-sans font-semibold text-[1.25rem] text-[#3c2e24] text-center">
            Podcast
          </div>
          <Grid className="w-full max-w-[45.188rem] px-3">
            <GridRow>
              {podcastPosts.map((post, index) => (
                <Article key={post._id} href={`/podcast/${post.slug.current}`}>
                  <ArticleImage
                    src={post.featuredImage?.asset?.url}
                    alt={post.featuredImage?.alt || post.title}
                    rotation={index % 2 === 0 ? 'left' : 'right'}
                  />
                  <ArticleContent>
                    <ArticleTitle>{post.title}</ArticleTitle>
                    {post.excerpt && <ArticleExcerpt>{post.excerpt}</ArticleExcerpt>}
                    <ArticleDate date={post.publishedAt} />
                  </ArticleContent>
                </Article>
              ))}
            </GridRow>
          </Grid>
        </div>
      )}

      {/* Events Section */}
      <div className="flex flex-col gap-[0.938rem] items-center w-full pb-[1.563rem]">
        <div className="font-sans font-semibold text-[1.25rem] text-[#3c2e24] text-center">
          Events
        </div>
        <Grid className="w-full max-w-[45.188rem] px-3">
          <GridRow>
            <Article href="/events/transforming-memory">
              <ArticleImage
                src={img2062PxEthelWatersWilliamP4}
                alt="Transforming Memory into Story"
                rotation="left"
              />
              <ArticleContent>
                <ArticleTitle>Transforming Memory into Story</ArticleTitle>
                <ArticleExcerpt>
                  Karen Cheung on drawing from raw material in personal archives
                </ArticleExcerpt>
                <ArticleDate date="March 29, 2025" />
              </ArticleContent>
            </Article>

            <Article href="/events/essay-contest-2025">
              <ArticleImage
                src={img847PxCabCallowayGottlieb18}
                alt="2025 NüStories Essay Contest"
                rotation="right"
              />
              <ArticleContent>
                <ArticleTitle>2025 NüStories Essay Contest</ArticleTitle>
                <ArticleExcerpt>
                  Our first non-fiction personal essay contest focuses on the theme of Chinese identity
                </ArticleExcerpt>
                <ArticleDate date="January 22, 2025" />
              </ArticleContent>
            </Article>

            <Article href="/events/freelance-writing-pitching">
              <ArticleImage
                src={img847PxCabCallowayGottlieb19}
                alt="Freelance Writing and Pitching"
                rotation="left"
              />
              <ArticleContent>
                <ArticleTitle>Freelance Writing and Pitching</ArticleTitle>
                <ArticleExcerpt>
                  Suyin Haynes and Jessie Lau cover everything that goes into a stand-out pitch
                </ArticleExcerpt>
                <ArticleDate date="June 1, 2025" />
              </ArticleContent>
            </Article>
          </GridRow>
        </Grid>
      </div>
    </div>
  );
}