/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  DB: D1Database;
  TIMESTAMP_URL: string;
  CSV_URL: string;
}


/**
 * Query parameters for GET /records endpoint
 */
export interface RecordsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string; // Full-text search query using FTS5
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
  created_time?: string;
  last_modified_time?: string;
  [key: string]: any; // Dynamic fields from Google Sheets
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
