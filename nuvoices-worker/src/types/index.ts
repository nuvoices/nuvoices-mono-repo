/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  DB: D1Database;
  ACCESS_TOKEN: string;
  BASE_ID: string;
  TABLE_NAME: string;
}

/**
 * Airtable field types
 */
export type AirtableFieldType =
  | "singleLineText"
  | "email"
  | "url"
  | "multilineText"
  | "number"
  | "percent"
  | "currency"
  | "singleSelect"
  | "multipleSelects"
  | "singleCollaborator"
  | "multipleCollaborators"
  | "multipleRecordLinks"
  | "date"
  | "dateTime"
  | "phoneNumber"
  | "multipleAttachments"
  | "checkbox"
  | "formula"
  | "createdTime"
  | "rollup"
  | "count"
  | "lookup"
  | "multipleLookupValues"
  | "autoNumber"
  | "barcode"
  | "rating"
  | "richText"
  | "duration"
  | "lastModifiedTime"
  | "button"
  | "createdBy"
  | "lastModifiedBy"
  | "externalSyncSource";

/**
 * Airtable field definition
 */
export interface AirtableField {
  id: string;
  name: string;
  type: AirtableFieldType;
}

/**
 * Airtable record structure
 */
export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, any>;
}

/**
 * Airtable API response for list records
 */
export interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

/**
 * Airtable API response for table schema
 */
export interface AirtableTableSchema {
  id: string;
  name: string;
  fields: AirtableField[];
}

/**
 * Airtable webhook payload for record updates
 */
export interface AirtableWebhookPayload {
  base: {
    id: string;
  };
  webhook: {
    id: string;
  };
  timestamp: string;
  // Webhook can contain created, updated, or destroyed records
  createdRecordsById?: Record<string, AirtableRecord>;
  changedRecordsById?: Record<string, {
    current: AirtableRecord;
    previous?: AirtableRecord;
    unchanged?: AirtableRecord;
    changedFields?: string[];
  }>;
  destroyedRecordIds?: string[];
}

/**
 * Query parameters for GET /records endpoint
 */
export interface RecordsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  [key: string]: string | number | undefined; // Allow arbitrary filter fields
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * D1 database record structure
 */
export interface DBRecord {
  id: string;
  airtable_id: string;
  created_time: string;
  last_modified_time?: string;
  fields: string; // JSON string of all fields
  [key: string]: any; // Dynamic fields from Airtable
}

/**
 * SQL query builder result
 */
export interface SQLQuery {
  sql: string;
  params: any[];
}

/**
 * Database schema column definition
 */
export interface ColumnDefinition {
  name: string;
  type: "TEXT" | "INTEGER" | "REAL" | "BLOB";
  nullable: boolean;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
