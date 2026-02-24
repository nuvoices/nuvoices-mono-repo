export const SUBCATEGORY_PRIORITY = [
  { slug: 'analysis', title: 'Analysis' },
  { slug: 'personal-essay', title: 'Personal Essay' },
  { slug: 'profile', title: 'Profile' },
  { slug: 'books', title: 'Books' },
  { slug: 'film', title: 'Film' },
  { slug: 'art', title: 'Art' },
] as const;

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

export function getDisplaySubcategory(
  categories: Category[] | undefined,
): { slug: string; title: string } | null {
  if (!categories || categories.length === 0) return null;

  const slugs = new Set(categories.map((c) => c.slug.current));

  for (const sub of SUBCATEGORY_PRIORITY) {
    if (slugs.has(sub.slug)) {
      return { slug: sub.slug, title: sub.title };
    }
  }

  return null;
}
