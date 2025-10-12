import type { AirtableRecord } from "../types";
import { sanitizeColumnName } from "./query-builder";

/**
 * Result of processing Airtable fields for SQL operations
 */
export interface ProcessedFields {
  columns: string[];
  values: any[];
  placeholders: string[];
}

/**
 * Process Airtable record fields into SQL column names, values, and placeholders
 * Eliminates duplication across insert/update operations
 */
export function prepareFieldValues(
  record: AirtableRecord,
  fields: Array<{ name: string; type: string }>
): ProcessedFields {
  const columns: string[] = [];
  const values: any[] = [];
  const placeholders: string[] = [];

  for (const field of fields) {
    const columnName = sanitizeColumnName(field.name);
    const fieldValue = record.fields[field.name];

    columns.push(columnName);
    placeholders.push("?");

    // Handle different value types
    if (fieldValue === undefined || fieldValue === null) {
      values.push(null);
    } else if (typeof fieldValue === "object") {
      // Store complex objects as JSON strings
      values.push(JSON.stringify(fieldValue));
    } else {
      values.push(fieldValue);
    }
  }

  return { columns, values, placeholders };
}
