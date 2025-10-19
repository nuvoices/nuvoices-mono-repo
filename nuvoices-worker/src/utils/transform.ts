/**
 * Response transformation utilities
 *
 * Converts D1 database responses (all strings) to properly typed objects
 * based on the journalist schema.
 */

import type { DBRecord } from "../types";
import { JOURNALIST_SCHEMA, toSqlColumnName, type JournalistRecord } from "../schema/journalist-schema";

/**
 * Transform a database record to properly typed journalist record
 *
 * D1 HTTP API returns all values as strings, even for INTEGER and REAL columns.
 * This function converts string numbers back to actual numbers based on schema.
 *
 * @param dbRecord - Raw record from D1 (all string values)
 * @returns Properly typed record with numbers converted
 */
export function transformRecord(dbRecord: DBRecord): JournalistRecord {
  const result: any = { ...dbRecord };

  // Convert each field based on its schema type
  for (const field of JOURNALIST_SCHEMA) {
    const columnName = toSqlColumnName(field.name);
    const value = result[columnName];

    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Convert based on SQL type
    if (field.sqlType === 'INTEGER') {
      const num = parseInt(value, 10);
      result[columnName] = isNaN(num) ? null : num;
    } else if (field.sqlType === 'REAL') {
      const num = parseFloat(value);
      result[columnName] = isNaN(num) ? null : num;
    }
    // TEXT fields stay as-is (already strings)
  }

  return result as JournalistRecord;
}

/**
 * Transform array of database records
 *
 * @param dbRecords - Array of raw records from D1
 * @returns Array of properly typed records
 */
export function transformRecords(dbRecords: DBRecord[]): JournalistRecord[] {
  return dbRecords.map(transformRecord);
}
