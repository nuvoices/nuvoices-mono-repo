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
    <div className="min-h-screen bg-pink-50">
      {/* Main content */}
      <main className="pt-16 pb-16">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif mb-4">NüStories</h1>
            <p className="text-xl italic mb-8">A magazine of ideas from minority voices on China subjects</p>
            <a href="/submissions" className="px-8 py-3 bg-amber-900 text-white font-medium uppercase text-sm tracking-wider hover:bg-amber-800 transition inline-block">
              SUBMISSIONS
            </a>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link key={post._id} href={`/magazine/${post.slug.current}`}>
                  <article className="group cursor-pointer">
                    <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                      {post.featuredImage?.asset?.url ? (
                        <Image
                          src={post.featuredImage.asset.url}
                          alt={post.featuredImage.alt || post.title}
                          width={400}
                          height={192}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          [No Image]
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-serif mb-2 group-hover:underline">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 mb-2 italic line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </article>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-600">No magazine articles found.</p>
                <p className="text-sm text-gray-500 mt-2">Make sure to create posts with the &quot;magazine&quot; category in Sanity Studio.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-pink-200 py-8">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-700">Powered by WordPress</p>
            <nav className="flex gap-6 text-sm">
              <a href="/about" className="hover:underline">About</a>
              <a href="/join" className="hover:underline">Join</a>
              <a href="/donate" className="hover:underline">Donate</a>
              <a href="/submissions" className="hover:underline">Submit</a>
              <a href="/contact" className="hover:underline">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}