import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";

export const runtime = "edge";

// Configure the image URL builder
const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

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
    body[] {
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
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

export const revalidate = 3600; // Revalidate every hour

export default async function MagazineArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<Post | null>(postQuery, { slug });

  console.log('post', post);
  
  // Debug: Check if there are any image blocks in the body
  const imageBlocks = post?.body?.filter((block: any) => block._type === 'image');
  console.log('Image blocks found:', imageBlocks);
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
          <PortableText 
            value={post.body}
            components={{
              types: {
                image: ({value}: any) => {
                  console.log('Rendering image block:', value);
                  
                  if (!value?.asset) {
                    console.log('No asset found in image block');
                    return null;
                  }
                  
                  // Use the image URL builder to construct the proper URL
                  const imageUrl = urlFor(value).width(1200).url();
                  
                  if (!imageUrl) {
                    console.log('Could not generate image URL');
                    return null;
                  }
                  
                  console.log('Generated image URL:', imageUrl);
                  
                  return (
                    <div className="my-8">
                      <Image
                        src={imageUrl}
                        alt={value.alt || ''}
                        width={1200}
                        height={800}
                        className="w-full h-auto"
                        style={{ objectFit: 'cover' }}
                      />
                      {(value.caption || value.alt) && (
                        <p className="text-sm text-gray-600 mt-2 text-center italic">
                          {value.caption || value.alt}
                        </p>
                      )}
                    </div>
                  );
                }
              },
              marks: {
                link: ({children, value}: {children: React.ReactNode; value?: {href?: string}}) => {
                  const rel = value?.href && !value.href.startsWith('/') ? 'noreferrer noopener' : undefined;
                  return (
                    <a href={value?.href || '#'} rel={rel} className="text-amber-900 underline hover:text-amber-700">
                      {children}
                    </a>
                  );
                },
              },
              block: {
                normal: ({children}: {children?: React.ReactNode}) => <p className="mb-4">{children}</p>,
                h1: ({children}: {children?: React.ReactNode}) => <h1 className="text-3xl font-bold mb-4 mt-8">{children}</h1>,
                h2: ({children}: {children?: React.ReactNode}) => <h2 className="text-2xl font-bold mb-4 mt-6">{children}</h2>,
                h3: ({children}: {children?: React.ReactNode}) => <h3 className="text-xl font-bold mb-3 mt-4">{children}</h3>,
                h4: ({children}: {children?: React.ReactNode}) => <h4 className="text-lg font-bold mb-2 mt-3">{children}</h4>,
                blockquote: ({children}: {children?: React.ReactNode}) => (
                  <blockquote className="italic border-l-4 border-gray-300 pl-4 my-4">{children}</blockquote>
                ),
              },
            }}
          />
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