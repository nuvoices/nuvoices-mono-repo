import { client } from '@/sanity/client'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ArticleDetailPage } from "@/components/ArticleDetailPage";

export const runtime = "edge";

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
  const episode = await client.fetch<PodcastEpisode>(EPISODE_QUERY, { slug: slug.toLowerCase() })

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
  const episode = await client.fetch<PodcastEpisode>(EPISODE_QUERY, { slug: slug.toLowerCase() })

  if (!episode) {
    notFound()
  }

  const navigation = await client.fetch<{
    previous: NavigationEpisode | null
    next: NavigationEpisode | null
  }>(NAVIGATION_QUERY, { publishedAt: episode.publishedAt })

  // Map episode to the Post interface expected by ArticleDetailPage
  const post = {
    _id: episode._id,
    title: episode.title,
    slug: episode.slug,
    excerpt: episode.excerpt,
    publishedAt: episode.publishedAt,
    featuredImage: episode.featuredImage ? {
      asset: {
        _id: '',
        url: episode.featuredImage.asset.url
      },
      alt: episode.title
    } : undefined,
    author: episode.author,
    body: episode.body
  };

  return (
    <ArticleDetailPage
      post={post}
      previousPost={navigation.previous}
      nextPost={navigation.next}
      basePath="podcast"
    />
  )
}