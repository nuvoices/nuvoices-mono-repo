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
      {/* Main content */}
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        {/* Title section - matching magazine page structure */}
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            Podcast
          </h1>
          <p className="text-[1.5625rem] font-serif italic leading-[1.1] tracking-[-0.047rem] text-black mb-[1.25rem]">
            A show coordinated, produced and edited by the NüVoices board.
          </p>
        </div>

        {/* Episodes Grid - using grid components */}
        <Content>
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
          <div className="text-center py-[6rem]">
            <p className="text-[#3c2e24] text-[1.5rem] font-serif mb-[1rem]">No podcast episodes found.</p>
            <p className="text-[1rem] text-[#3c2e24] opacity-75">Make sure to create posts with the &quot;podcast&quot; category in Sanity Studio.</p>
          </div>
        )}
        </Content>
      </main>
    </div>
  )
}