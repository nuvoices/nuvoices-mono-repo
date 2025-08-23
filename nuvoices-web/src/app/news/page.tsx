import Link from "next/link";
import Image from "next/image";

interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  submitBy?: string;
  publishedAt: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
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
    <main className="min-h-screen bg-[#F8F5F1]">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-serif text-center mb-4">News</h1>
        <p className="text-xl italic text-center mb-12">
          Events, highlights and latest developments in this space
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <article key={item._id} className="group">
              <Link href={`/news/${item.slug}`}>
                <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg bg-gray-200">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {item.submitBy && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
                      <p className="text-xs text-gray-600 uppercase font-medium">Submit By</p>
                      <p className="text-sm font-medium">
                        {formatDate(item.submitBy).replace(/,/g, '').split(' ').slice(0, 2).join(' ')}
                      </p>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-serif mb-2 group-hover:text-pink-600 transition-colors">
                  {item.title}
                </h2>
                <p className="text-gray-700 italic mb-2">
                  {item.excerpt}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(item.publishedAt)}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}