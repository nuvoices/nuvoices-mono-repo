/**
 * CSV Parser Utility
 *
 * Parses CSV text with support for quoted fields containing commas.
 * Infers SQL schema types from data values.
 */

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export interface FieldSchema {
  name: string;
  type: "TEXT" | "INTEGER" | "REAL";
}

/**
 * Parse CSV text to structured data
 * Handles quoted fields with commas: "English, Mandarin, Cantonese"
 */
export function parseCSV(csvText: string): ParsedCSV {
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length < 3) {
    throw new Error("CSV must have at least 3 rows (2 rows to skip + 1 header row)");
  }

  // Skip first 2 rows, use row 3 as headers
  const headers = parseCSVLine(lines[2]);
  const rows = lines.slice(3).map(line => parseCSVLine(line));

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Infer SQL schema from CSV data
 * Examines sample values to determine data types
 */
export function inferSchemaFromCSV(headers: string[], rows: string[][]): FieldSchema[] {
  const schema: FieldSchema[] = [];

  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    const columnName = headers[colIndex];
    const sampleValues = rows
      .slice(0, Math.min(10, rows.length)) // Sample first 10 rows
      .map(row => row[colIndex])
      .filter(val => val && val.trim() !== '');

    const inferredType = inferColumnType(sampleValues);

    schema.push({
      name: columnName,
      type: inferredType
    });
  }

  return schema;
}

/**
 * Infer SQL type from sample values
 */
function inferColumnType(sampleValues: string[]): "TEXT" | "INTEGER" | "REAL" {
  if (sampleValues.length === 0) {
    return "TEXT"; // Default
  }

  let hasInteger = false;
  let hasReal = false;
  let hasText = false;

  for (const value of sampleValues) {
    if (value.match(/^-?\d+$/)) {
      // Integer: "123", "-456"
      hasInteger = true;
    } else if (value.match(/^-?\d+\.\d+$/)) {
      // Real/Float: "123.45", "-67.89"
      hasReal = true;
    } else {
      // Everything else is text
      hasText = true;
    }
  }

  // Priority: TEXT > REAL > INTEGER
  if (hasText) return "TEXT";
  if (hasReal) return "REAL";
  if (hasInteger) return "INTEGER";

  return "TEXT";
}

/**
 * Convert CSV rows to record objects
 */
export function csvToRecords(headers: string[], rows: string[][]): Array<Record<string, string>> {
  return rows.map((row, index) => {
    const record: Record<string, string> = {
      id: `row_${index + 2}` // Row 1 is headers, so data starts at row 2
    };

    headers.forEach((header, colIndex) => {
      const value = row[colIndex];
      if (value && value.trim() !== '') {
        record[header] = value;
      }
    });

    return record;
  });
}
