import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import { EmbedRenderer } from "@/components/EmbedRenderer";

export const runtime = "edge";

// Configure the image URL builder
const builder = imageUrlBuilder(client);

function urlFor(source: { _type?: string; asset?: { _ref?: string; _type?: string } }) {
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

interface NavigationPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
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

// Queries to get previous and next posts
const previousPostQuery = groq`
  *[_type == "post" && publishedAt > $publishedAt] | order(publishedAt asc)[0] {
    _id,
    title,
    slug
  }
`;

const nextPostQuery = groq`
  *[_type == "post" && publishedAt < $publishedAt] | order(publishedAt desc)[0] {
    _id,
    title,
    slug
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

  if (!post) {
    notFound();
  }

  // Fetch previous and next posts separately
  const [previousPost, nextPost] = await Promise.all([
    client.fetch<NavigationPost | null>(previousPostQuery, {
      publishedAt: post.publishedAt
    }),
    client.fetch<NavigationPost | null>(nextPostQuery, {
      publishedAt: post.publishedAt
    })
  ]);

  console.log('post', post);
  console.log('navigation', { previous: previousPost, next: nextPost });

  // Debug: Check if there are any image blocks in the body
  const imageBlocks = post?.body?.filter((block) => block._type === 'image');
  console.log('Image blocks found:', imageBlocks);

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Hero Section with Featured Image */}
      {post.featuredImage?.asset?.url && (
        <div className="relative h-[28.25rem] bg-[#f4ecea] max-w-[45rem] mx-auto">
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
      <article className="max-w-[35.71875rem] mx-auto px-6 py-[1.5625rem]">
        {/* Article Title */}
        <h1 className="text-center text-[2.96875rem] leading-[1.1] tracking-[-0.089rem] font-serif text-[#3c2e24] mb-[1.25rem]">
          {post.title}
        </h1>

        {/* Article Meta */}
        <div className="text-center mb-[2.5rem]">
          {post.author && (
            <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif">
              {post.author.name}
            </div>
          )}
          <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif">
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Excerpt if exists */}
        {post.excerpt && (
          <div className="text-center mb-[2.5rem]">
            <p className="text-[0.9375rem] italic text-black font-serif leading-[1.6] max-w-[35.875rem] mx-auto">
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Article Body */}
        <div className="max-w-none">
          <PortableText 
            value={post.body}
            components={{
              types: {
                image: ({value}: {value: {
                  asset?: { _ref?: string; _type?: string };
                  alt?: string;
                  caption?: string;
                  width?: number;
                  height?: number;
                  alignment?: string;
                }}) => {
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

                  // Use width from caption if available, otherwise use full width
                  const maxWidth = value.width ? `${value.width}px` : '100%';

                  return (
                    <div className="my-[1.5rem]">
                      <div
                        className="mx-auto"
                        style={{ maxWidth }}
                      >
                        <Image
                          src={imageUrl}
                          alt={value.alt || ''}
                          width={value.width || 1143}
                          height={value.height || 800}
                          className="w-full h-auto"
                          style={{ objectFit: 'cover' }}
                        />
                        {(value.caption || value.alt) && (
                          <p className="text-[0.875rem] text-[#3c2e24] mt-2 text-center italic font-serif">
                            {value.caption || value.alt}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                },
                embed: ({value}: {value: { url?: string; platform?: string; embedId?: string; caption?: string }}) => {
                  return <EmbedRenderer value={value} />;
                }
              },
              marks: {
                link: ({children, value}: {children: React.ReactNode; value?: {href?: string}}) => {
                  const rel = value?.href && !value.href.startsWith('/') ? 'noreferrer noopener' : undefined;
                  return (
                    <a href={value?.href || '#'} rel={rel} className="text-[#3c2e24] underline hover:text-amber-700">
                      {children}
                    </a>
                  );
                },
              },
              block: {
                normal: ({children}: {children?: React.ReactNode}) => (
                  <p className="text-[0.9375rem] leading-[1.6] mb-[0.9375rem] text-black font-serif">{children}</p>
                ),
                h1: ({children}: {children?: React.ReactNode}) => (
                  <h1 className="text-[1.5rem] font-bold mb-[0.9375rem] mt-[1.5rem] text-[#3c2e24] font-serif">{children}</h1>
                ),
                h2: ({children}: {children?: React.ReactNode}) => (
                  <h2 className="text-[1.25rem] font-bold mb-[0.9375rem] mt-[1.25rem] text-[#3c2e24] font-serif">{children}</h2>
                ),
                h3: ({children}: {children?: React.ReactNode}) => (
                  <h3 className="text-[1.125rem] font-bold mb-[0.75rem] mt-[1rem] text-[#3c2e24] font-serif">{children}</h3>
                ),
                h4: ({children}: {children?: React.ReactNode}) => (
                  <h4 className="text-[1rem] font-bold mb-[0.625rem] mt-[0.75rem] text-[#3c2e24] font-serif">{children}</h4>
                ),
                blockquote: ({children}: {children?: React.ReactNode}) => (
                  <blockquote className="italic border-l-4 border-[#dd9ca1] pl-4 my-[0.9375rem] text-[0.9375rem] text-[#3c2e24] font-serif">{children}</blockquote>
                ),
              },
            }}
          />
        </div>

        {/* Author Bio */}
        {post.author && post.author.bio && (
          <div className="mt-[2.5rem] pt-[1.5rem] border-t border-[#dd9ca1]">
            <div className="text-[0.9375rem] leading-[1.6] text-black font-serif italic">
              <p>{post.author.bio}</p>
            </div>
          </div>
        )}
      </article>

      {/* Previous/Next Navigation */}
      <div className="max-w-[35.71875rem] mx-auto px-6 py-[3rem]">
        <div className="flex justify-between gap-[2.25rem]">
          {/* Previous Article */}
          <div className="flex-1">
            {previousPost ? (
              <Link href={`/magazine/${previousPost.slug.current}`} className="group block no-underline">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem]">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    ← Previous
                  </div>
                  <div className="text-[0.6875rem] italic text-black font-serif font-semibold leading-[1.6] tracking-[-0.02rem] group-hover:text-[#3c2e24] transition-colors">
                    {previousPost.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="opacity-0 pointer-events-none">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem]">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    ← Previous
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Article */}
          <div className="flex-1">
            {nextPost ? (
              <Link href={`/magazine/${nextPost.slug.current}`} className="group block no-underline">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem] text-right">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    Next →
                  </div>
                  <div className="text-[0.6875rem] italic text-black font-serif font-semibold leading-[1.6] tracking-[-0.02rem] group-hover:text-[#3c2e24] transition-colors">
                    {nextPost.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="opacity-0 pointer-events-none">
                <div className="border-t border-[#3c2e24] pt-[1.3125rem] text-right">
                  <div className="text-[0.6875rem] italic text-[#3c2e24] font-serif tracking-[-0.02rem] mb-[0.875rem]">
                    Next →
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}