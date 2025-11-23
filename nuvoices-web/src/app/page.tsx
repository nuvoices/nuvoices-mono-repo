import Image from "next/image"
import { client } from "@/sanity/client"
import { groq } from "next-sanity"
import {
  Grid,
  GridRow,
  Article,
  ArticleContent,
  ArticleImage,
  ArticleTitle,
  ArticleExcerpt,
  ArticleDate,
} from "@/components/ui/grid"
import { Content, FullWidthBreakout } from "@/components/ui/Content"
import ActionButton from "@/components/ActionButton"

interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  excerpt?: string
  publishedAt: string
  featuredImage?: {
    asset?: {
      _id: string
      url: string
    }
    alt?: string
  }
  author?: {
    name: string
  }
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
`

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
`

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
`

// Query to get latest 3 news/events posts
const newsPostsQuery = groq`
  *[_type == "post" && status == "published" && "events" in categories[]->slug.current] | order(publishedAt desc) [0...3] {
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
`

export default async function Home() {
  // Fetch featured post first to exclude from category queries
  const featuredPost = await client.fetch<Post | null>(featuredPostQuery)

  // Build category queries with featured post exclusion
  const magazinePostsQueryFiltered = groq`
    *[_type == "post" && status == "published" && "featuredstories" in categories[]->slug.current${featuredPost ? ` && _id != "${featuredPost._id}"` : ''}] | order(publishedAt desc) [0...3] {
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
  `

  const podcastPostsQueryFiltered = groq`
    *[_type == "post" && status == "published" && "podcast" in categories[]->slug.current${featuredPost ? ` && _id != "${featuredPost._id}"` : ''}] | order(publishedAt desc) [0...3] {
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
  `

  const newsPostsQueryFiltered = groq`
    *[_type == "post" && status == "published" && "events" in categories[]->slug.current${featuredPost ? ` && _id != "${featuredPost._id}"` : ''}] | order(publishedAt desc) [0...3] {
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
  `

  // Fetch category posts in parallel
  const [magazinePosts, podcastPosts, newsPosts] = await Promise.all([
    client.fetch<Post[]>(magazinePostsQueryFiltered),
    client.fetch<Post[]>(podcastPostsQueryFiltered),
    client.fetch<Post[]>(newsPostsQueryFiltered),
  ])
  return (
    <div className='bg-[#f4ecea] flex flex-col gap-[1.563rem] items-center min-h-screen'>
      {/* Hero Section */}
      <Content className='relative'>
        <div className='flex flex-col items-center gap-[1.563rem] pt-[1.563rem]'>
          {/* Logo placeholder - 270px x 354px */}
          <div className='w-[8.438rem] h-[11.063rem] relative'>
            <Image
              src='/nuvoices-logo.png'
              alt='NüVoices Logo'
              width={270}
              height={354}
              className='w-full h-full object-cover'
            />
          </div>

          {/* Tagline - 110px = 3.438rem, responsive sizing */}
          <div className='font-serif text-[2rem] sm:text-[2.5rem] md:text-[3.438rem] leading-[1.2] text-[#3c2e24] text-center tracking-[-0.103rem] max-w-[38.844rem]'>
            Amplifying women and minority voices on China
          </div>

          {/* Buttons - 252px x 99px, 35px text */}
          <div className='flex gap-[0.938rem]'>
            <ActionButton href='/join' label='JOIN' />
            <ActionButton label='DONATE' />
            <ActionButton href='/explore' label='EXPLORE' />
          </div>
        </div>
      </Content>

      {/* Featured Section */}
      {featuredPost && (
        <div className='flex flex-col gap-[0.938rem] items-center w-full'>
           <div className='flex flex-col items-center justify-center mt-[3rem] mb-[-1.5rem] w-full'>
              <h2 className="font-['Raleway',sans-serif] font-semibold text-[1.8rem] leading-[1.6] tracking-[12px] text-black text-center">
                FEATURED 
              </h2>
            </div>
          <Content className='flex flex-col gap-[0.625rem] items-center'>
            <a
              href={`/magazine/${featuredPost.slug.current}`}
              className='flex flex-col gap-[0.625rem] items-center w-full no-underline hover:no-underline'
            >
              {featuredPost.featuredImage?.asset?.url && (
                <div
                  className='h-[18.75rem] relative -mx-[2.5rem]'
                  style={{ width: "calc(100% + 5rem)" }}
                >
                  <Image
                    src={featuredPost.featuredImage.asset.url}
                    alt={featuredPost.featuredImage.alt || featuredPost.title}
                    fill
                    className='object-cover'
                  />
                </div>
              )}
              <div className='font-serif text-[1.875rem] text-[#3c2e24] text-center tracking-[-0.056rem]'>
                {featuredPost.title}
              </div>
              <div className='font-serif italic text-[1rem] text-[#3c2e24] text-center'>
                {new Date(featuredPost.publishedAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </div>
            </a>
          </Content>
        </div>
      )}

      {/* Magazine Section */}
      {magazinePosts.length > 0 && (
        <div className='flex flex-col gap-[0.938rem] items-center w-full'>
          <Content>
             <div className='flex flex-col items-center justify-center mb-[1.8rem] mt-[2rem] w-full'>
              <h2 className="font-['Raleway',sans-serif] font-semibold text-[1.8rem] mb-[1rem] leading-[1.6] tracking-[12px] text-black text-center">
                MAGAZINE
              </h2>
              <div className='w-full h-[1px] bg-black'></div>
            </div>
            <Grid>
              <GridRow>
                {magazinePosts.map((post, index) => (
                  <Article
                    key={post._id}
                    href={`/magazine/${post.slug.current}`}
                  >
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
          </Content>
        </div>
      )}

      {/* Podcast Section */}
      {podcastPosts.length > 0 && (
        <div className='flex flex-col gap-[0.938rem] items-center w-full'>
          <Content>
             <div className='flex flex-col items-center justify-center mb-[1.8rem] mt-[2rem] w-full'>
              <h2 className="font-['Raleway',sans-serif] font-semibold text-[1.8rem] mb-[1rem] leading-[1.6] tracking-[12px] text-black text-center">
                PODCAST
              </h2>
              <div className='w-full h-[1px] bg-black'></div>
            </div>
            <Grid>
              <GridRow>
                {podcastPosts.map((post, index) => (
                  <Article
                    key={post._id}
                    href={`/podcast/${post.slug.current}`}
                  >
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
          </Content>
        </div>
      )}

      {/* News Section */}
      {newsPosts.length > 0 && (
        <div className='flex flex-col gap-[0.938rem] items-center w-full pb-[1.563rem]'>
          <Content>
            <div className='flex flex-col items-center justify-center mb-[1.8rem] mt-[2rem] w-full'>
              <h2 className="font-['Raleway',sans-serif] font-semibold text-[1.8rem] mb-[1rem] leading-[1.6] tracking-[12px] text-black text-center">
                NEWS
              </h2>
              <div className='w-full h-[1px] bg-black'></div>
            </div>
            <Grid>
              <GridRow>
                {newsPosts.map((post, index) => (
                  <Article key={post._id} href={`/news/${post.slug.current}`}>
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
          </Content>
        </div>
      )}
    </div>
  )
}
