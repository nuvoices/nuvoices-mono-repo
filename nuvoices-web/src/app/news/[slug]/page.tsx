import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { ArticleDetailPage } from "@/components/ArticleDetailPage";

export const runtime = "edge";

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
  *[_type == "post" && slug.current == $slug && status == "published" && "news" in categories[]->slug.current][0] {
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

// Queries to get previous and next posts within news category
const previousPostQuery = groq`
  *[_type == "post" && status == "published" && "news" in categories[]->slug.current && publishedAt > $publishedAt] | order(publishedAt asc)[0] {
    _id,
    title,
    slug
  }
`;

const nextPostQuery = groq`
  *[_type == "post" && status == "published" && "news" in categories[]->slug.current && publishedAt < $publishedAt] | order(publishedAt desc)[0] {
    _id,
    title,
    slug
  }
`;

export const revalidate = 3600; // Revalidate every hour

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<Post | null>(postQuery, { slug: slug.toLowerCase() });

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

  return (
    <ArticleDetailPage
      post={post}
      previousPost={previousPost}
      nextPost={nextPost}
      basePath="news"
    />
  )
}