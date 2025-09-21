import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/sanity/client'
import { groq } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import { notFound } from 'next/navigation'
import imageUrlBuilder from "@sanity/image-url";

export const runtime = "edge";

// Configure the image URL builder
const builder = imageUrlBuilder(client);

function urlFor(source: { _type?: string; asset?: { _ref?: string; _type?: string } }) {
  return builder.image(source);
}

interface PodcastEpisode {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  publishedAt: string
  featuredImage?: {
    asset: {
      url: string
    }
  }
  author: {
    name: string
    bio?: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

interface NavigationEpisode {
  title: string
  slug: { current: string }
}

const EPISODE_QUERY = groq`
  *[_type == "post" && slug.current == $slug && status == "published" && "podcast" in categories[]->slug.current][0] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    featuredImage {
      asset-> {
        url
      }
    },
    author-> {
      name,
      bio
    },
    body,
    seo
  }
`

const NAVIGATION_QUERY = groq`{
  "previous": *[_type == "post" && status == "published" && "podcast" in categories[]->slug.current && publishedAt > $publishedAt] | order(publishedAt asc)[0] {
    title,
    slug
  },
  "next": *[_type == "post" && status == "published" && "podcast" in categories[]->slug.current && publishedAt < $publishedAt] | order(publishedAt desc)[0] {
    title,
    slug
  }
}`

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const episode = await client.fetch<PodcastEpisode>(EPISODE_QUERY, { slug })

  console.log(episode)
  
  if (!episode) {
    return {
      title: 'Episode Not Found',
    }
  }

  return {
    title: episode.seo?.metaTitle || episode.title,
    description: episode.seo?.metaDescription || episode.excerpt,
  }
}

export default async function PodcastEpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const episode = await client.fetch<PodcastEpisode>(EPISODE_QUERY, { slug })

  if (!episode) {
    notFound()
  }

  const navigation = await client.fetch<{
    previous: NavigationEpisode | null
    next: NavigationEpisode | null
  }>(NAVIGATION_QUERY, { publishedAt: episode.publishedAt })

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Hero Section with Featured Image */}
      {episode.featuredImage?.asset?.url && (
        <div className="relative h-[28.25rem] bg-[#f4ecea] max-w-[45rem] mx-auto">
          <Image
            src={episode.featuredImage.asset.url}
            alt={episode.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-[35.71875rem] mx-auto px-6 py-[1.5625rem]">
        {/* Article Title */}
        <h1 className="text-center text-[2.96875rem] leading-[1.1] tracking-[-0.089rem] font-serif text-[#3c2e24] mb-[1.25rem]">
          {episode.title}
        </h1>

        {/* Article Meta */}
        <div className="text-center mb-[2.5rem]">
          {episode.author && (
            <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif">
              {episode.author.name}
            </div>
          )}
          <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif">
            {new Date(episode.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Excerpt if exists */}
        {episode.excerpt && (
          <div className="text-center mb-[2.5rem]">
            <p className="text-[0.9375rem] italic text-black font-serif leading-[1.6] max-w-[35.875rem] mx-auto">
              {episode.excerpt}
            </p>
          </div>
        )}

        {/* Article Body */}
        <div className="max-w-none">
          <PortableText
            value={episode.body}
            components={{
              types: {
                image: ({value}: {value: { asset?: { _ref?: string; _type?: string }; alt?: string; caption?: string }}) => {
                  if (!value?.asset) {
                    return null;
                  }

                  // Use the image URL builder to construct the proper URL
                  const imageUrl = urlFor(value).width(1200).url();

                  if (!imageUrl) {
                    return null;
                  }

                  return (
                    <div className="my-[1.5rem]">
                      <Image
                        src={imageUrl}
                        alt={value.alt || ''}
                        width={1143}
                        height={800}
                        className="w-full h-auto"
                        style={{ objectFit: 'cover' }}
                      />
                      {(value.caption || value.alt) && (
                        <p className="text-[0.875rem] text-[#3c2e24] mt-2 text-center italic font-serif">
                          {value.caption || value.alt}
                        </p>
                      )}
                    </div>
                  );
                }
              },
              marks: {
                link: ({children, value}: {children: React.ReactNode; value?: {href?: string}}) => {
                  const rel = value?.href && !value.href.startsWith('/') ? 'noreferrer noopener' : undefined;
                  return (
                    <a href={value?.href || '#'} rel={rel} className="text-[#3c2e24] underline hover:text-amber-700">
                      {children}
                    </a>
                  );
                },
              },
              block: {
                normal: ({children}: {children?: React.ReactNode}) => (
                  <p className="text-[0.9375rem] leading-[1.6] mb-[0.9375rem] text-black font-serif">{children}</p>
                ),
                h1: ({children}: {children?: React.ReactNode}) => (
                  <h1 className="text-[1.5rem] font-bold mb-[0.9375rem] mt-[1.5rem] text-[#3c2e24] font-serif">{children}</h1>
                ),
                h2: ({children}: {children?: React.ReactNode}) => (
                  <h2 className="text-[1.25rem] font-bold mb-[0.9375rem] mt-[1.25rem] text-[#3c2e24] font-serif">{children}</h2>
                ),
                h3: ({children}: {children?: React.ReactNode}) => (
                  <h3 className="text-[1.125rem] font-bold mb-[0.75rem] mt-[1rem] text-[#3c2e24] font-serif">{children}</h3>
                ),
                h4: ({children}: {children?: React.ReactNode}) => (
                  <h4 className="text-[1rem] font-bold mb-[0.625rem] mt-[0.75rem] text-[#3c2e24] font-serif">{children}</h4>
                ),
                blockquote: ({children}: {children?: React.ReactNode}) => (
                  <blockquote className="italic border-l-4 border-[#dd9ca1] pl-4 my-[0.9375rem] text-[0.9375rem] text-[#3c2e24] font-serif">{children}</blockquote>
                ),
              },
            }}
          />
        </div>

        {/* Author Bio */}
        {episode.author && episode.author.bio && (
          <div className="mt-[2.5rem] pt-[1.5rem] border-t border-[#dd9ca1]">
            <div className="text-[0.9375rem] leading-[1.6] text-black font-serif italic">
              <p>{episode.author.bio}</p>
            </div>
          </div>
        )}
      </article>

      {/* Previous/Next Navigation */}
      <div className="max-w-[35.71875rem] mx-auto px-6 py-[3rem]">
        <div className="flex justify-between gap-[2.25rem]">
          {/* Previous Article */}
          <div className="flex-1">
            {navigation.previous ? (
              <Link href={`/podcast/${navigation.previous.slug.current}`} className="group block no-underline">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem]">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    ← Previous
                  </div>
                  <div className="text-[0.6875rem] italic text-black font-serif font-semibold leading-[1.6] tracking-[-0.02rem] group-hover:text-[#3c2e24] transition-colors">
                    {navigation.previous.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="opacity-0 pointer-events-none">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem]">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    ← Previous
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Article */}
          <div className="flex-1">
            {navigation.next ? (
              <Link href={`/podcast/${navigation.next.slug.current}`} className="group block no-underline">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem] text-right">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    Next →
                  </div>
                  <div className="text-[0.6875rem] italic text-black font-serif font-semibold leading-[1.6] tracking-[-0.02rem] group-hover:text-[#3c2e24] transition-colors">
                    {navigation.next.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="opacity-0 pointer-events-none">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem] text-right">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    Next →
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}