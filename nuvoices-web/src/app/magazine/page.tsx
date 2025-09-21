import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";

interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
  publishedAt: string;
  featuredImage?: {
    asset?: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  author?: {
    name: string;
  };
}

const magazinePostsQuery = groq`
  *[_type == "post" && status == "published" && "featuredstories" in categories[]->slug.current] | order(publishedAt desc) {
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
`;

export default async function MagazinePage() {
  const posts = await client.fetch<Post[]>(magazinePostsQuery);
  console.log(posts)

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Main content */}
      <main className="flex flex-col items-center gap-[1.5625rem] pb-[3rem]">
        {/* Title section - 369px height = 11.531rem, 1234px width = 38.5625rem */}
        <div className="flex flex-col items-center justify-center h-[11.531rem] w-full max-w-[38.5625rem] text-center">
          <h1 className="text-[2.5rem] font-serif leading-[1.1] tracking-[-0.075rem] text-black mb-[0.5rem]">
            NüStories
          </h1>
          <p className="text-[1.5625rem] font-serif italic leading-[1.1] tracking-[-0.047rem] text-black mb-[1.25rem]">
            A magazine of ideas from minority voices on China subjects
          </p>
          <a
            href="/submissions"
            className="inline-block px-[2.5rem] py-[0.75rem] bg-[#3c2e24] text-[#f5f4f1] font-sans font-extrabold uppercase text-[0.781rem] leading-[1.1] rounded-[0.313rem] hover:bg-opacity-90 transition no-underline"
          >
            SUBMISSIONS
          </a>
        </div>

        {/* Articles Grid - 1446px = 45.1875rem width, 606px = 18.9375rem height per row */}
        <div className="w-full max-w-[45.1875rem] px-6">
          {posts.length > 0 ? (
            <div className="flex flex-col gap-[0.9375rem]">
              {/* Group posts into rows of 3 */}
              {Array.from({ length: Math.ceil(posts.length / 3) }, (_, rowIndex) => (
                <div key={rowIndex} className="flex gap-[0.313rem] justify-center">
                  {posts.slice(rowIndex * 3, (rowIndex + 1) * 3).map((post, indexInRow) => (
                    <Link key={post._id} href={`/magazine/${post.slug.current}`} className="block no-underline" style={{ textDecoration: 'none' }}>
                      <article className="group cursor-pointer w-[14.813rem] flex flex-col gap-[0.313rem]">
                        {/* Image container - 424px = 13.25rem width, 326px = 10.188rem height */}
                        <div className="relative w-[13.25rem] h-[10.188rem] flex items-center justify-center">
                          <div className={`w-full h-full ${indexInRow % 2 === 0 ? '-rotate-2' : 'rotate-2'}`}>
                            {post.featuredImage?.asset?.url ? (
                              <Image
                                src={post.featuredImage.asset.url}
                                alt={post.featuredImage.alt || post.title}
                                width={424}
                                height={326}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                <span className="text-[0.875rem]">[No Image]</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title section */}
                        <div className="flex flex-col gap-[0.313rem]">
                          {/* Title - 45-50px = 1.406-1.5625rem */}
                          <h3 className="text-[1.5625rem] font-serif leading-[1.1] tracking-[-0.047rem] text-[#3c2e24]" style={{ marginBlock: 0 }}>
                            {post.title}
                          </h3>

                          {/* Excerpt - 22px = 0.688rem */}
                          {post.excerpt && (
                            <p className="text-[0.688rem] font-serif italic leading-[1.1] text-[#3c2e24] line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}

                          {/* Date - 22px = 0.688rem */}
                          <p className="text-[0.688rem] font-serif leading-[1.1] text-[#3c2e24]">
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-[6rem]">
              <p className="text-[#3c2e24] text-[1.5rem] font-serif mb-[1rem]">No magazine articles found.</p>
              <p className="text-[1rem] text-[#3c2e24] opacity-75">Make sure to create posts with the &quot;featuredstories&quot; category in Sanity Studio.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}