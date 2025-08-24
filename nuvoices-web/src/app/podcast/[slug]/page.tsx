import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/sanity/client'
import { groq } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import { notFound } from 'next/navigation'

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

export async function generateStaticParams() {
  try {
    const posts = await client.fetch<{ slug: { current: string } }[]>(
      groq`*[_type == "post" && status == "published" && "podcast" in categories[]->slug.current] { slug }`
    );

    if (!posts || posts.length === 0) {
      return [];
    }

    return posts.map((post) => ({
      slug: post.slug.current,
    }));
  } catch (error) {
    console.error('Error fetching podcast posts:', error);
    return [];
  }
}

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
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Episode Image */}
        <div className="aspect-[4/3] bg-gray-200 mb-8 overflow-hidden relative max-w-2xl mx-auto">
          {episode.featuredImage?.asset?.url ? (
            <Image
              src={episode.featuredImage.asset.url}
              alt={episode.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              [Episode Featured Image]
            </div>
          )}
        </div>

        {/* Episode Title */}
        <h1 className="text-4xl md:text-5xl font-serif text-center mb-6 leading-tight">
          {episode.title}
        </h1>

        {/* Episode Date */}
        <p className="text-center text-gray-600 mb-12">
          {new Date(episode.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>

        {/* Episode Info */}
        <div className="mb-8">
          {episode.excerpt && (
            <p className="text-lg italic text-gray-700 mb-8">{episode.excerpt}</p>
          )}
          
          {/* Episode Body Content */}
          <div className="prose prose-lg max-w-none">
            <PortableText 
              value={episode.body}
              components={{
                marks: {
                  link: ({children, value}) => {
                    const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
                    return (
                      <a href={value.href} rel={rel} className="underline">
                        {children}
                      </a>
                    )
                  },
                },
                block: {
                  normal: ({children}) => <p className="mb-4">{children}</p>,
                  h1: ({children}) => <h1 className="text-3xl font-bold mb-4 mt-8">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-bold mb-4 mt-6">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-bold mb-3 mt-4">{children}</h3>,
                  blockquote: ({children}) => <blockquote className="italic border-l-4 border-gray-300 pl-4 my-4">{children}</blockquote>,
                },
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-300 my-12" />

        {/* About Author Section */}
        {episode.author.bio && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">About the Author</h2>
            <p className="text-gray-700">{episode.author.bio}</p>
          </section>
        )}

        {/* Navigation */}
        <div className="border-t border-gray-300 pt-8 mt-12">
          <div className="flex justify-between items-start gap-4">
            {navigation.previous ? (
              <Link href={`/podcast/${navigation.previous.slug.current}`} className="flex-1 text-left">
                <p className="text-sm text-gray-500 mb-1">← Previous</p>
                <p className="text-sm hover:underline">
                  {navigation.previous.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {navigation.next ? (
              <Link href={`/podcast/${navigation.next.slug.current}`} className="flex-1 text-right">
                <p className="text-sm text-gray-500 mb-1">Next →</p>
                <p className="text-sm hover:underline">
                  {navigation.next.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-pink-200 py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-700">Powered by WordPress</p>
            <nav className="flex gap-6 text-sm">
              <a href="/about" className="hover:underline">About</a>
              <a href="/join" className="hover:underline">Join</a>
              <a href="/donate" className="hover:underline">Donate</a>
              <a href="/submit" className="hover:underline">Submit</a>
              <a href="/contact" className="hover:underline">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}