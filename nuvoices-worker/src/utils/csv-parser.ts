/**
 * CSV Parser Utility
 *
 * Parses CSV text with support for quoted fields containing commas.
 * All fields are treated as TEXT type.
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
 * Split CSV text into lines while respecting quoted fields
 * Newlines inside quoted fields are preserved as part of the field value
 */
function splitCSVLines(csvText: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      // Only treat newline as line separator when not inside quotes
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  // Add the last line if it's not empty
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse CSV text to structured data
 * Handles quoted fields with commas: "English, Mandarin, Cantonese"
 * Skips first 2 rows and uses row 3 as headers
 */
export function parseCSV(csvText: string): ParsedCSV {
  const lines = splitCSVLines(csvText);

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
 * Convert CSV rows to record objects
 */
export function csvToRecords(headers: string[], rows: string[][]): Array<Record<string, string>> {
  return rows.map((row, index) => {
    const record: Record<string, string> = {
      id: `row_${index + 4}` // Rows 1-2 skipped, row 3 is headers, so data starts at row 4
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
