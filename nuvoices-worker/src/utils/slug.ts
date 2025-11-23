/**
 * Utility functions for generating URL-friendly slugs from names
 */

/**
 * Convert a name to a URL-friendly slug
 * @param name - The name to convert to a slug
 * @returns URL-friendly slug (lowercase, hyphens, no special chars)
 *
 * @example
 * generateSlug("John Smith") // "john-smith"
 * generateSlug("Mary O'Brien") // "mary-obrien"
 * generateSlug("José García") // "jose-garcia"
 */
export function generateSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate unique slugs for an array of names
 * Handles duplicates by appending numbers (e.g., john-smith, john-smith-2)
 *
 * @param names - Array of names to generate slugs for
 * @returns Array of unique slugs corresponding to each name
 *
 * @example
 * generateUniqueSlugs(["John Smith", "Jane Doe", "John Smith"])
 * // ["john-smith", "jane-doe", "john-smith-2"]
 */
export function generateUniqueSlugs(names: string[]): string[] {
  const slugCounts = new Map<string, number>();
  const result: string[] = [];

  for (const name of names) {
    const baseSlug = generateSlug(name);

    if (!baseSlug) {
      // Handle empty slugs (e.g., names with only special characters)
      result.push('unnamed');
      continue;
    }

    // Check if this slug has been used before
    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);

    // If this is a duplicate, append the count
    const uniqueSlug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;
    result.push(uniqueSlug);
  }

  return result;
}

/**
 * Generate unique slugs for records with an index-based approach
 * This is useful when processing records in order and need to handle duplicates
 *
 * @param records - Array of records with a name field
 * @returns Array of records with added slug field
 */
export function addSlugsToRecords<T extends { name: string }>(
  records: T[]
): (T & { slug: string })[] {
  const slugCounts = new Map<string, number>();

  return records.map((record) => {
    const baseSlug = generateSlug(record.name);

    if (!baseSlug) {
      return { ...record, slug: 'unnamed' };
    }

    // Check if this slug has been used before
    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);

    // If this is a duplicate, append the count
    const uniqueSlug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

    return { ...record, slug: uniqueSlug };
  });
}
