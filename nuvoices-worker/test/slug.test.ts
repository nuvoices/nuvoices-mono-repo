import { describe, it, expect } from 'vitest';
import { generateSlug, generateUniqueSlugs, addSlugsToRecords } from '../src/utils/slug';

describe('generateSlug', () => {
  it('converts basic names to slugs', () => {
    expect(generateSlug('John Smith')).toBe('john-smith');
    expect(generateSlug('Jane Doe')).toBe('jane-doe');
  });

  it('handles accented characters', () => {
    expect(generateSlug('José García')).toBe('jose-garcia');
    expect(generateSlug('François Müller')).toBe('francois-muller');
    expect(generateSlug('Zoë Saldaña')).toBe('zoe-saldana');
  });

  it('handles special characters', () => {
    expect(generateSlug("Mary O'Brien")).toBe('mary-obrien');
    expect(generateSlug('Dr. Smith, PhD')).toBe('dr-smith-phd');
    expect(generateSlug('Anna-Marie')).toBe('anna-marie');
  });

  it('handles multiple spaces and hyphens', () => {
    expect(generateSlug('John   Smith')).toBe('john-smith');
    expect(generateSlug('Mary--Anne')).toBe('mary-anne');
    expect(generateSlug('  Jane  Doe  ')).toBe('jane-doe');
  });

  it('handles edge cases', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('   ')).toBe('');
    expect(generateSlug('123')).toBe('123');
    expect(generateSlug('!!!@@@')).toBe('');
  });

  it('handles Chinese and other non-Latin characters', () => {
    // Non-Latin characters should be removed
    expect(generateSlug('李明 Li Ming')).toBe('li-ming');
    expect(generateSlug('田中太郎')).toBe('');
  });

  it('handles mixed case', () => {
    expect(generateSlug('JOHN SMITH')).toBe('john-smith');
    expect(generateSlug('JoHn SmItH')).toBe('john-smith');
  });
});

describe('generateUniqueSlugs', () => {
  it('generates unique slugs for different names', () => {
    const names = ['John Smith', 'Jane Doe', 'Mary Johnson'];
    const slugs = generateUniqueSlugs(names);

    expect(slugs).toEqual(['john-smith', 'jane-doe', 'mary-johnson']);
  });

  it('handles duplicate names by appending numbers', () => {
    const names = ['John Smith', 'Jane Doe', 'John Smith'];
    const slugs = generateUniqueSlugs(names);

    expect(slugs).toEqual(['john-smith', 'jane-doe', 'john-smith-2']);
  });

  it('handles multiple duplicates', () => {
    const names = ['John Smith', 'John Smith', 'John Smith', 'Jane Doe'];
    const slugs = generateUniqueSlugs(names);

    expect(slugs).toEqual(['john-smith', 'john-smith-2', 'john-smith-3', 'jane-doe']);
  });

  it('handles empty or invalid names', () => {
    const names = ['John Smith', '', '!!!', 'Jane Doe'];
    const slugs = generateUniqueSlugs(names);

    expect(slugs).toEqual(['john-smith', 'unnamed', 'unnamed', 'jane-doe']);
  });

  it('handles case-insensitive duplicates', () => {
    const names = ['John Smith', 'JOHN SMITH', 'john smith'];
    const slugs = generateUniqueSlugs(names);

    expect(slugs).toEqual(['john-smith', 'john-smith-2', 'john-smith-3']);
  });
});

describe('addSlugsToRecords', () => {
  it('adds unique slugs to records', () => {
    const records = [
      { name: 'John Smith', email: 'john@example.com' },
      { name: 'Jane Doe', email: 'jane@example.com' },
      { name: 'John Smith', email: 'john2@example.com' },
    ];

    const result = addSlugsToRecords(records);

    expect(result[0]).toEqual({
      name: 'John Smith',
      email: 'john@example.com',
      slug: 'john-smith',
    });
    expect(result[1]).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      slug: 'jane-doe',
    });
    expect(result[2]).toEqual({
      name: 'John Smith',
      email: 'john2@example.com',
      slug: 'john-smith-2',
    });
  });

  it('preserves all original record fields', () => {
    const records = [
      { name: 'John Smith', email: 'john@example.com', age: 30, active: true },
    ];

    const result = addSlugsToRecords(records);

    expect(result[0]).toEqual({
      name: 'John Smith',
      email: 'john@example.com',
      age: 30,
      active: true,
      slug: 'john-smith',
    });
  });

  it('handles empty records array', () => {
    const records: { name: string }[] = [];
    const result = addSlugsToRecords(records);
    expect(result).toEqual([]);
  });
});
