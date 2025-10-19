/**
 * Strict schema definition for journalist/expert records
 *
 * This schema defines the expected structure of data from Google Sheets.
 * Using a strict schema instead of dynamic inference provides:
 * - Type safety and predictable API responses
 * - Automatic type conversion (strings to numbers where appropriate)
 * - Clear validation rules
 * - Better developer experience
 */

export interface SchemaField {
  name: string;           // CSV column name (as it appears in Google Sheets)
  sqlType: 'TEXT' | 'INTEGER' | 'REAL';  // SQL column type
  required: boolean;      // Whether this field must be present
}

/**
 * Fixed schema for journalist records
 * Based on the Google Sheets structure
 */
export const JOURNALIST_SCHEMA: SchemaField[] = [
  { name: 'Name', sqlType: 'TEXT', required: true },
  { name: 'Email', sqlType: 'TEXT', required: true },
  { name: 'Phone', sqlType: 'TEXT', required: false },
  { name: 'Country', sqlType: 'TEXT', required: true },
  { name: 'City', sqlType: 'TEXT', required: false },
  { name: 'Languages', sqlType: 'TEXT', required: false },
  { name: 'Specializations', sqlType: 'TEXT', required: false },
  { name: 'Years_Experience', sqlType: 'INTEGER', required: false },
  { name: 'Outlet', sqlType: 'TEXT', required: false },
  { name: 'Time_Zone', sqlType: 'TEXT', required: false },
  { name: 'LinkedIn_Profile', sqlType: 'TEXT', required: false },
  { name: 'Avatar', sqlType: 'TEXT', required: false },
  { name: 'Daily_Rate_USD', sqlType: 'INTEGER', required: false },
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
 * Validate that CSV headers contain all required fields
 */
export function validateCSVHeaders(headers: string[]): void {
  const requiredFields = JOURNALIST_SCHEMA
    .filter(field => field.required)
    .map(field => field.name);

  const missingFields = requiredFields.filter(
    required => !headers.includes(required)
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields in CSV: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Get schema field by CSV column name
 */
export function getSchemaField(csvName: string): SchemaField | undefined {
  return JOURNALIST_SCHEMA.find(field => field.name === csvName);
}
