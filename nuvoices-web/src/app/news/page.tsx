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

interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  submitBy?: string;
  publishedAt: string;
}

// Static data for now
const newsItems: NewsItem[] = [
  {
    _id: "1",
    title: "Transforming Memory into Story",
    slug: "transforming-memory-into-story",
    excerpt: "Karen Cheung on drawing from raw material in personal archives",
    thumbnail: "/placeholder-news-1.jpg",
    publishedAt: "2023-03-29",
  },
  {
    _id: "2", 
    title: "2025 NüStories Essay Contest",
    slug: "2025-nustories-essay-contest",
    excerpt: "Our first non-fiction personal essay contest focuses on the theme of Chinese identity",
    thumbnail: "/placeholder-news-2.jpg",
    submitBy: "2025-01-22",
    publishedAt: "2023-01-22",
  },
  {
    _id: "3",
    title: "Freelance Writing and Pitching",
    slug: "freelance-writing-and-pitching",
    excerpt: "Suyin Haynes and Jessie Lau cover everything that goes into a stand-out pitch",
    thumbnail: "/placeholder-news-3.jpg",
    publishedAt: "2023-06-01",
  },
];

export default async function NewsPage() {

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Main content */}
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        {/* Title section - matching magazine page dimensions */}
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            News
          </h1>
          <p className="text-[1.5625rem] font-serif italic leading-[1.1] tracking-[-0.047rem] text-black">
            Events, highlights and latest developments in this space
          </p>
        </div>

        {/* Articles Grid - using grid components */}
        <div className="w-full max-w-[45.1875rem] px-6">
          {newsItems.length > 0 ? (
            <Grid>
              {/* Group news items into rows of 3 */}
              {Array.from({ length: Math.ceil(newsItems.length / 3) }, (_, rowIndex) => (
                <GridRow key={rowIndex}>
                  {newsItems.slice(rowIndex * 3, (rowIndex + 1) * 3).map((item, indexInRow) => (
                    <Article key={item._id} href={`/news/${item.slug}`}>
                      <ArticleImage
                        src={item.thumbnail}
                        alt={item.title}
                        rotation={indexInRow % 2 === 0 ? 'left' : 'right'}
                      />
                      <ArticleContent>
                        <ArticleTitle>{item.title}</ArticleTitle>
                        <ArticleExcerpt>{item.excerpt}</ArticleExcerpt>
                        {item.submitBy ? (
                          <div className="text-[0.688rem] font-serif text-[#3c2e24]">
                            Submit by: {new Date(item.submitBy).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        ) : (
                          <ArticleDate date={item.publishedAt} />
                        )}
                      </ArticleContent>
                    </Article>
                  ))}
                </GridRow>
              ))}
            </Grid>
          ) : (
            <div className="text-center py-[6rem]">
              <p className="text-[#3c2e24] text-[1.5rem] font-serif mb-[1rem]">No news articles found.</p>
              <p className="text-[1rem] text-[#3c2e24] opacity-75">Check back soon for updates.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}