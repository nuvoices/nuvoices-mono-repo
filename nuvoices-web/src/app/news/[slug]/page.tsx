import { notFound } from "next/navigation";
import Image from "next/image";

interface NewsItemData {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  submitBy?: string;
  publishedAt: string;
  content: string;
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
const newsItems: NewsItemData[] = [
  {
    _id: "1",
    title: "Transforming Memory into Story with Karen Cheung",
    slug: "transforming-memory-into-story",
    excerpt: "Karen Cheung on drawing from raw material in personal archives",
    thumbnail: "/placeholder-news-1.jpg",
    publishedAt: "2025-05-13",
    content: `There are some stories inside us that feel emotionally urgent, yet every time we try and write about them they fall flat on the page, or we only manage a few sentences before we find ourselves unable to continue. This could be an eventful family holiday, a friendship you're still grieving years after it ended, or a relationship with a difficult family member.

In this two-hour workshop, we'll learn to draw from the raw material in our personal archives — diary entries, photographs, old chat logs, and more — and turn them into a piece of non-fiction writing. The workshop will begin with a discussion of an assigned essay, after which participants will engage in interactive creative writing exercises to test out various forms — such as the fragmented essay, hermit crab essay, or prose poem. It will end with a Q&A about memoir writing.

By the end of the workshop, participants should expect to generate at least an opening or a few sections they could then use as a jumping-off point for an essay to be completed later in their own time.

**Date:** Saturday, March 29 2025
**Time:** 10am–12pm EST  
**Location:** Zoom
**Price:** $40 USD regular admission / $20 USD concession rate (students, members, and recent graduates)`,
  },
  {
    _id: "2", 
    title: "2025 NüStories Essay Contest",
    slug: "2025-nustories-essay-contest",
    excerpt: "Our first non-fiction personal essay contest focuses on the theme of Chinese identity",
    thumbnail: "/placeholder-news-2.jpg",
    submitBy: "2025-01-22",
    publishedAt: "2023-01-22",
    content: "We are excited to announce our first non-fiction personal essay contest. This contest focuses on the theme of Chinese identity and welcomes submissions from writers of all backgrounds who want to explore this rich and complex topic.",
  },
  {
    _id: "3",
    title: "Freelance Writing and Pitching",
    slug: "freelance-writing-and-pitching",
    excerpt: "Suyin Haynes and Jessie Lau cover everything that goes into a stand-out pitch",
    thumbnail: "/placeholder-news-3.jpg",
    publishedAt: "2023-06-01",
    content: "Join Suyin Haynes and Jessie Lau as they share their expertise on freelance writing and creating pitches that stand out. This comprehensive guide covers everything from research to follow-up strategies.",
  },
];

export async function generateStaticParams() {
  return newsItems.map((item) => ({
    slug: item.slug,
  }));
}

export default async function NewsItemPage({
  params,
}: {
  params: { slug: string };
}) {
  const newsItem = newsItems.find(item => item.slug === params.slug);

  if (!newsItem) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8F5F1]">
      <div className="container mx-auto px-6 py-8">
        {/* Hero Image with Date Badge */}
        <div className="relative aspect-[2/1] mb-8 overflow-hidden rounded-lg bg-gray-200">
          <Image
            src={newsItem.thumbnail}
            alt={newsItem.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-full px-6 py-4 text-center">
            <p className="text-xs text-gray-600 uppercase font-medium tracking-wider">
              {new Date(newsItem.publishedAt).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
            </p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(newsItem.publishedAt).getDate()} {new Date(newsItem.publishedAt).toLocaleDateString('en-US', { month: 'long' }).toUpperCase()} {new Date(newsItem.publishedAt).getFullYear()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(newsItem.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} PST / 
              {new Date(new Date(newsItem.publishedAt).getTime() + 3*60*60*1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} EST
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-serif text-center mb-6">
            {newsItem.title}
          </h1>

          {/* Date */}
          <p className="text-center text-gray-600 italic mb-12">
            {formatDate(newsItem.publishedAt)}
          </p>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            {newsItem.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed mb-6">
                {paragraph.includes('**') ? (
                  paragraph.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )
                ) : paragraph}
              </p>
            ))}
          </div>

          {/* Register Button */}
          {newsItem.slug === 'transforming-memory-into-story' && (
            <div className="text-center mb-12">
              <button className="bg-gray-800 text-white px-8 py-3 text-sm font-medium tracking-wider hover:bg-gray-700 transition-colors">
                REGISTER HERE
              </button>
            </div>
          )}

          {/* About the host section */}
          {newsItem.slug === 'transforming-memory-into-story' && (
            <div className="border-t pt-8 mb-12">
              <h3 className="text-xl font-serif mb-4">About the host</h3>
              <p className="text-gray-700 italic leading-relaxed">
                A writer from Hong Kong, Karen Cheung is the author of <em>The Impossible City: A Hong Kong Memoir</em>, 
                which was longlisted for the Andrew Carnegie Medal for Excellence in Nonfiction, and named one of the best books 
                of the year by the Washington Post and The Economist. She&apos;s written for the New York Times, Feld Magazine, 
                Washington Post and The Los Angeles Review of Books, the Oxonian Review, the Rampus, and other publications. 
                She has an MA in Creative Writing (New Prose Narratives) from Royal Holloway, University of London.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="border-t pt-8 flex justify-between text-sm">
            <div>
              <p className="text-gray-600 mb-1">← Previous</p>
              <p className="text-gray-800 hover:text-pink-600 cursor-pointer">
                Feminist Rebels from Face-Off: the U.S. vs China with Jane Perlez
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-1">Next →</p>
              <p className="text-gray-800 hover:text-pink-600 cursor-pointer">
                Somalie Figureras, Demystifying Eco-Living and Sustainability Myths
              </p>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}