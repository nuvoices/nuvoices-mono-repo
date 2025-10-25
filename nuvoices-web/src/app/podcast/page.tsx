import { client } from '@/sanity/client'
import { groq } from 'next-sanity'
import {
  Grid,
  GridRow,
  Article,
  ArticleContent,
  ArticleImage,
  ArticleTitle,
  ArticleExcerpt,
  ArticleDate,
} from '@/components/ui/grid'
import { Content } from '@/components/ui/Content'

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
      <Content className="py-16">
        <h1 className="text-5xl font-serif text-center mb-6">Podcast</h1>
        <p className="text-xl italic text-center mb-16">
          A show coordinated, produced and edited by the NüVoices board.
        </p>

        {/* Episodes Grid - using grid components */}
        {episodes.length > 0 ? (
          <Grid>
            <GridRow>
              {episodes.map((episode, index) => (
                <Article key={episode._id} href={`/podcast/${episode.slug.current}`}>
                  <ArticleImage
                    src={episode.featuredImage?.asset?.url}
                    alt={episode.title}
                    rotation={index % 2 === 0 ? 'left' : 'right'}
                  />
                  <ArticleContent>
                    <ArticleTitle>{episode.title}</ArticleTitle>
                    {episode.excerpt && <ArticleExcerpt>{episode.excerpt}</ArticleExcerpt>}
                    <ArticleDate date={episode.publishedAt} />
                  </ArticleContent>
                </Article>
              ))}
            </GridRow>
          </Grid>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No podcast episodes found. Make sure to create posts with the &quot;podcast&quot; category in Sanity.</p>
          </div>
        )}
      </Content>
    </div>
  )
}