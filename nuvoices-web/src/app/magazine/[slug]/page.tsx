import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { PortableText } from "@portabletext/react";

interface Category {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
}

interface Tag {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
}

interface Author {
  name: string;
  bio?: string;
  image?: {
    asset?: {
      _id: string;
      url: string;
    };
  };
}

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
  author?: Author;
  body: Array<{
    _type: string;
    [key: string]: unknown;
  }>;
  categories?: Category[];
  tags?: Tag[];
}

const postQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
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
      name,
      bio,
      image {
        asset->{
          _id,
          url
        }
      }
    },
    body,
    categories[]->{
      _id,
      title,
      slug
    },
    tags[]->{
      _id,
      title,
      slug
    }
  }
`;

export async function generateStaticParams() {
  try {
    const posts = await client.fetch<{ slug: { current: string } }[]>(
      groq`*[_type == "post" && status == "published" && "magazine" in categories[]->slug.current] { slug }`
    );

    if (!posts || posts.length === 0) {
      return [];
    }

    return posts.map((post) => ({
      slug: post.slug.current,
    }));
  } catch (error) {
    console.error('Error fetching magazine posts:', error);
    return [];
  }
}

export default async function MagazineArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<Post | null>(postQuery, { slug });

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Featured Image */}
      {post.featuredImage?.asset?.url && (
        <div className="relative h-[70vh] bg-gray-200">
          <Image
            src={post.featuredImage.asset.url}
            alt={post.featuredImage.alt || post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Article Title */}
        <h1 className="text-5xl font-serif mb-8 text-gray-900">
          {post.title}
        </h1>

        {/* Article Meta */}
        <div className="text-sm text-gray-600 mb-12">
          {post.excerpt && (
            <p className="italic mb-2">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4">
            {post.author && (
              <span>By {post.author.name}</span>
            )}
            <span>•</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none">
          <PortableText value={post.body} />
        </div>

        {/* Author Bio */}
        {post.author && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex items-start gap-4">
              {post.author.image?.asset?.url && (
                <Image
                  src={post.author.image.asset.url}
                  alt={post.author.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg mb-2">About {post.author.name}</h3>
                {post.author.bio && (
                  <p className="text-gray-600">{post.author.bio}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categories and Tags */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          {post.categories && post.categories.length > 0 && (
            <div className="mb-4">
              <span className="font-semibold mr-2">Categories:</span>
              {post.categories.map((category, index: number) => (
                <span key={category._id}>
                  <Link 
                    href={`/category/${category.slug.current}`}
                    className="text-amber-900 hover:underline"
                  >
                    {category.title}
                  </Link>
                  {index < post.categories!.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
          {post.tags && post.tags.length > 0 && (
            <div>
              <span className="font-semibold mr-2">Tags:</span>
              {post.tags.map((tag, index: number) => (
                <span key={tag._id}>
                  <Link 
                    href={`/tag/${tag.slug.current}`}
                    className="text-amber-900 hover:underline"
                  >
                    {tag.title}
                  </Link>
                  {index < post.tags!.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-6 py-8 border-t border-gray-200">
        <div className="flex justify-center">
          <Link 
            href="/magazine" 
            className="inline-block px-8 py-3 bg-amber-900 text-white font-medium uppercase text-sm tracking-wider hover:bg-amber-800 transition"
          >
            Back to Magazine
          </Link>
        </div>
      </div>
    </div>
  )
}