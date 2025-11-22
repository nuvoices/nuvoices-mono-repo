import { describe, it, expect } from 'vitest';
import { parseCSV } from '../src/utils/csv-parser';

describe('parseCSV', () => {
  it('should skip first 2 rows and use row 3 as headers', () => {
    const csvText = `Row 1 - Skip this line
Row 2 - Skip this line too
Name,Email,Country
John Doe,john@example.com,USA
Jane Smith,jane@example.com,Canada`;

    const result = parseCSV(csvText);

    expect(result.headers).toEqual(['Name', 'Email', 'Country']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['John Doe', 'john@example.com', 'USA']);
    expect(result.rows[1]).toEqual(['Jane Smith', 'jane@example.com', 'Canada']);
  });

  it('should handle empty CSV after skipping rows', () => {
    const csvText = `Skip row 1
Skip row 2
Headers Only`;

    const result = parseCSV(csvText);

    expect(result.headers).toEqual(['Headers Only']);
    expect(result.rows).toHaveLength(0);
  });

  it('should throw error if less than 3 rows', () => {
    const csvText = `Only one row
Only two rows`;

    expect(() => parseCSV(csvText)).toThrow('CSV must have at least 3 rows');
  });
});
