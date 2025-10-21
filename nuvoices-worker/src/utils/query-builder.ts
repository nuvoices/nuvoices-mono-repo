import type { RecordsQueryParams, SQLQuery } from "../types";
import type { SchemaField } from "../schema/journalist-schema";

/**
 * Reserved query parameter keys that should not be treated as filters
 */
const RESERVED_PARAMS = ["page", "limit", "sort", "order", "search"];

/**
 * SQL reserved keywords that cannot be used as column names
 */
const SQL_RESERVED_WORDS = new Set([
  "select", "from", "where", "insert", "update", "delete", "drop", "create",
  "alter", "table", "index", "view", "join", "inner", "outer", "left", "right",
  "on", "as", "order", "by", "group", "having", "union", "and", "or", "not",
  "null", "is", "in", "between", "like", "exists", "case", "when", "then",
  "else", "end", "distinct", "all", "limit", "offset", "asc", "desc",
]);

/**
 * SQL type mapping for Airtable field types
 */
export function getSQLType(airtableType: string): "TEXT" | "INTEGER" | "REAL" {
  switch (airtableType) {
    case "number":
    case "autoNumber":
    case "count":
    case "rating":
      return "INTEGER";
    case "percent":
    case "currency":
    case "duration":
      return "REAL";
    default:
      return "TEXT";
  }
}

/**
 * Sanitize column name for SQL (replace spaces with underscores, lowercase)
 * Adds field_ prefix if name is a SQL reserved word
 */
export function sanitizeColumnName(name: string): string {
  let sanitized = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  // Prefix with "field_" if it's a reserved word
  if (SQL_RESERVED_WORDS.has(sanitized)) {
    sanitized = `field_${sanitized}`;
  }

  return sanitized;
}

/**
 * Validate column name against a whitelist (for runtime safety)
 * Returns true if column is safe to use in queries
 */
export function validateColumnName(columnName: string, allowedColumns: Set<string>): boolean {
  return allowedColumns.has(columnName) ||
         columnName === "airtable_id" ||
         columnName === "created_time" ||
         columnName === "last_modified_time";
}

/**
 * Build WHERE clause from query parameters
 */
export function buildWhereClause(params: RecordsQueryParams): SQLQuery {
  const conditions: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(params)) {
    // Skip reserved parameters and undefined values
    if (RESERVED_PARAMS.includes(key) || value === undefined) {
      continue;
    }

    const columnName = sanitizeColumnName(key);

    // Handle different filter patterns
    if (typeof value === "string") {
      // Check for operators in the value
      if (value.startsWith(">=")) {
        conditions.push(`${columnName} >= ?`);
        values.push(value.slice(2).trim());
      } else if (value.startsWith("<=")) {
        conditions.push(`${columnName} <= ?`);
        values.push(value.slice(2).trim());
      } else if (value.startsWith(">")) {
        conditions.push(`${columnName} > ?`);
        values.push(value.slice(1).trim());
      } else if (value.startsWith("<")) {
        conditions.push(`${columnName} < ?`);
        values.push(value.slice(1).trim());
      } else if (value.startsWith("!=") || value.startsWith("<>")) {
        conditions.push(`${columnName} != ?`);
        values.push(value.slice(2).trim());
      } else if (value.includes("*") || value.includes("%")) {
        // LIKE pattern
        conditions.push(`${columnName} LIKE ?`);
        values.push(value.replace(/\*/g, "%"));
      } else {
        // Exact match
        conditions.push(`${columnName} = ?`);
        values.push(value);
      }
    } else {
      // Direct value match for numbers
      conditions.push(`${columnName} = ?`);
      values.push(value);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return {
    sql: whereClause,
    params: values,
  };
}

/**
 * Build ORDER BY clause from sort parameters
 */
export function buildOrderByClause(params: RecordsQueryParams): string {
  if (!params.sort) {
    return "ORDER BY created_time DESC"; // Default sort
  }

  const columnName = sanitizeColumnName(params.sort);
  const order = params.order?.toUpperCase() === "ASC" ? "ASC" : "DESC";

  return `ORDER BY ${columnName} ${order}`;
}

/**
 * Build complete SELECT query with filters, sorting, and pagination
 */
export function buildSelectQuery(
  params: RecordsQueryParams,
  limit: number,
  offset: number
): SQLQuery {
  const whereClause = buildWhereClause(params);
  const orderByClause = buildOrderByClause(params);

  const sql = `
    SELECT * FROM records
    ${whereClause.sql}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `.trim();

  const queryParams = [...whereClause.params, limit, offset];

  return {
    sql,
    params: queryParams,
  };
}

/**
 * Build COUNT query with filters
 */
export function buildCountQuery(params: RecordsQueryParams): SQLQuery {
  const whereClause = buildWhereClause(params);

  const sql = `
    SELECT COUNT(*) as count FROM records
    ${whereClause.sql}
  `.trim();

  return {
    sql,
    params: whereClause.params,
  };
}

/**
 * Build dynamic table schema based on Airtable fields
 */
export function buildCreateTableSQL(
  fields: SchemaField[]
): string {
  if (fields.length === 0) {
    // No fields - create table with just base columns
    return "CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, airtable_id TEXT UNIQUE NOT NULL, created_time TEXT NOT NULL, last_modified_time TEXT)";
  }

  const columnDefinitions = fields.map((field) => {
    const columnName = sanitizeColumnName(field.name);
    const sqlType = field.sqlType; // Use sqlType from SchemaField
    return `${columnName} ${sqlType}`;
  });

  return `CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, airtable_id TEXT UNIQUE NOT NULL, created_time TEXT NOT NULL, last_modified_time TEXT, ${columnDefinitions.join(", ")})`;
}

/**
 * Build CREATE INDEX statements for common query patterns
 */
export function buildCreateIndexSQL(): string[] {
  return [
    "CREATE INDEX IF NOT EXISTS idx_airtable_id ON records(airtable_id)",
    "CREATE INDEX IF NOT EXISTS idx_created_time ON records(created_time)",
    "CREATE INDEX IF NOT EXISTS idx_last_modified_time ON records(last_modified_time)",
  ];
}

/**
 * Build CREATE VIRTUAL TABLE statement for FTS5 full-text search
 * Creates an external content table linked to the main records table
 */
export function buildCreateFTS5TableSQL(): string {
  // FTS5 virtual table with all searchable text columns
  // Excluding numeric columns (years_experience, daily_rate_usd) and dates
  const searchableColumns = [
    "name",
    "email",
    "country",
    "city",
    "languages",
    "specializations",
    "outlet",
    "linkedin_profile",
  ];

  return `CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(${searchableColumns.join(", ")}, content=records, content_rowid=id)`;
}

/**
 * Build query to populate FTS5 table from main records table
 * Should be called after creating the FTS5 table and inserting records
 */
export function buildPopulateFTS5SQL(): string {
  return `INSERT INTO records_fts(records_fts) VALUES('rebuild')`;
}

/**
 * Transform search query to support partial matching using FTS5 prefix search
 * Adds wildcards (*) to each search term for prefix matching
 *
 * Examples:
 * - "man" → "man*" (matches "man", "mandarin", "manager", etc.)
 * - "man chi" → "man* chi*" (matches records with "mandarin" AND "chinese")
 * - "john@example" → "john* example*" (handles special characters)
 */
export function transformSearchQuery(query: string): string {
  if (!query || query.trim() === '') {
    return query;
  }

  // Split by whitespace and filter out empty strings
  const terms = query.trim().split(/\s+/).filter(term => term.length > 0);

  // Add wildcard to each term for prefix matching
  // Replace special FTS5 characters that could cause syntax errors
  const transformedTerms = terms.map(term => {
    // Remove special FTS5 operators and characters, keep alphanumeric and common punctuation
    const cleaned = term.replace(/[^a-zA-Z0-9@._-]/g, '');

    // Only add wildcard if term doesn't already have one and isn't empty
    if (cleaned.length > 0 && !cleaned.endsWith('*')) {
      return cleaned + '*';
    }
    return cleaned;
  }).filter(term => term.length > 0);

  return transformedTerms.join(' ');
}

/**
 * Build FTS5 search query with pagination
 * Searches across all columns in the FTS5 virtual table and joins back to main table
 * Automatically transforms query for partial matching (prefix search)
 */
export function buildSearchQuery(
  searchQuery: string,
  limit: number,
  offset: number
): SQLQuery {
  // Transform query to support partial matching
  const transformedQuery = transformSearchQuery(searchQuery);

  // FTS5 search using MATCH operator
  // Join back to main records table to get all fields
  const sql = `
    SELECT r.*
    FROM records r
    INNER JOIN records_fts fts ON r.id = fts.rowid
    WHERE records_fts MATCH ?
    ORDER BY rank
    LIMIT ? OFFSET ?
  `.trim();

  return {
    sql,
    params: [transformedQuery, limit, offset],
  };
}

/**
 * Build COUNT query for FTS5 search results
 * Automatically transforms query for partial matching (prefix search)
 */
export function buildSearchCountQuery(searchQuery: string): SQLQuery {
  // Transform query to support partial matching
  const transformedQuery = transformSearchQuery(searchQuery);

  const sql = `
    SELECT COUNT(*) as count
    FROM records_fts
    WHERE records_fts MATCH ?
  `.trim();

  return {
    sql,
    params: [transformedQuery],
  };
}
