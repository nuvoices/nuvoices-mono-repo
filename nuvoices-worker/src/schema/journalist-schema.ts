/**
 * Strict schema definition for journalist/expert records
 *
 * This schema is now dynamically generated from CSV headers.
 * All column types are TEXT to preserve data integrity.
 */

export interface SchemaField {
  name: string;           // CSV column name (as it appears in Google Sheets)
  sqlType: 'TEXT' | 'INTEGER' | 'REAL';  // SQL column type
  required: boolean;      // Whether this field must be present
}

/**
 * Create schema from CSV headers with all fields as TEXT
 * This ensures data integrity and avoids type conversion issues
 */
export function createSchemaFromHeaders(headers: string[]): SchemaField[] {
  return headers.map(header => ({
    name: header,
    sqlType: 'TEXT' as const,
    required: false, // No required fields since structure is dynamic
  }));
}

/**
 * Legacy JOURNALIST_SCHEMA for backwards compatibility
 * Will be replaced by dynamic schema from CSV headers
 * @deprecated Use createSchemaFromHeaders instead
 */
export const JOURNALIST_SCHEMA: SchemaField[] = [
  { name: 'Name', sqlType: 'TEXT', required: false },
  { name: 'Email', sqlType: 'TEXT', required: false },
  { name: 'Phone', sqlType: 'TEXT', required: false },
  { name: 'Country', sqlType: 'TEXT', required: false },
  { name: 'City', sqlType: 'TEXT', required: false },
  { name: 'Languages', sqlType: 'TEXT', required: false },
  { name: 'Specializations', sqlType: 'TEXT', required: false },
  { name: 'Years_Experience', sqlType: 'TEXT', required: false },
  { name: 'Outlet', sqlType: 'TEXT', required: false },
  { name: 'Time_Zone', sqlType: 'TEXT', required: false },
  { name: 'LinkedIn_Profile', sqlType: 'TEXT', required: false },
  { name: 'Avatar', sqlType: 'TEXT', required: false },
  { name: 'Daily_Rate_USD', sqlType: 'TEXT', required: false },
  { name: 'Available_For_Live', sqlType: 'TEXT', required: false },
  { name: 'Last_Updated', sqlType: 'TEXT', required: false },
];

/**
 * TypeScript type for journalist records as stored in D1
 * (all values are strings when retrieved from D1 HTTP API)
 */
export interface JournalistRecordRaw {
  airtable_id: string;
  created_time: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  city: string | null;
  languages: string | null;
  specializations: string | null;
  years_experience: string | null;  // Stored as INTEGER, but returned as string by D1 HTTP API
  outlet: string | null;
  time_zone: string | null;
  linkedin_profile: string | null;
  avatar: string | null;
  daily_rate_usd: string | null;    // Stored as INTEGER, but returned as string by D1 HTTP API
  available_for_live: string | null;
  last_updated: string | null;
}

/**
 * TypeScript type for journalist records after transformation
 * (numeric fields converted to actual numbers)
 */
export interface JournalistRecord {
  airtable_id: string;
  created_time: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  city: string | null;
  languages: string | null;
  specializations: string | null;
  years_experience: number | null;  // Converted to number
  outlet: string | null;
  time_zone: string | null;
  linkedin_profile: string | null;
  avatar: string | null;
  daily_rate_usd: number | null;    // Converted to number
  available_for_live: string | null;
  last_updated: string | null;
}

/**
 * Helper function to get SQL column name from CSV column name
 * Converts "Years_Experience" to "years_experience"
 */
export function toSqlColumnName(csvName: string): string {
  return csvName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Validate that CSV headers are present and non-empty
 * Since all fields are optional, we just check for non-empty headers
 */
export function validateCSVHeaders(headers: string[]): void {
  if (headers.length === 0) {
    throw new Error('CSV headers cannot be empty');
  }

  const emptyHeaders = headers.filter(h => !h || h.trim() === '');
  if (emptyHeaders.length > 0) {
    throw new Error('CSV contains empty header names');
  }
}

/**
 * Get schema field by CSV column name
 */
export function getSchemaField(csvName: string, schema: SchemaField[]): SchemaField | undefined {
  return schema.find(field => field.name === csvName);
}
