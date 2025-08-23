import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/sanity/client'
import { groq } from 'next-sanity'

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
  }
}

const PODCAST_QUERY = groq`
  *[_type == "post" && status == "published" && "podcast" in categories[]->slug.current] | order(publishedAt desc) {
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
      name
    }
  }
`

export default async function PodcastPage() {
  const episodes = await client.fetch<PodcastEpisode[]>(PODCAST_QUERY)

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-serif text-center mb-6">Podcast</h1>
        <p className="text-xl italic text-center mb-16">
          A show coordinated, produced and edited by the NüVoices board.
        </p>

        {/* Episodes Grid */}
        {episodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {episodes.map((episode) => (
              <Link 
                key={episode._id} 
                href={`/podcast/${episode.slug.current}`}
                className="group cursor-pointer"
              >
                <div className="aspect-square bg-gray-200 mb-4 overflow-hidden relative">
                  {episode.featuredImage?.asset?.url ? (
                    <Image
                      src={episode.featuredImage.asset.url}
                      alt={episode.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      [Podcast Episode Image]
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-serif mb-2 group-hover:underline">
                  {episode.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2 italic">
                  {episode.excerpt || episode.author.name}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(episode.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No podcast episodes found. Make sure to create posts with the "podcast" category in Sanity.</p>
          </div>
        )}
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