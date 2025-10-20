import type { DBRecord, RecordsQueryParams } from "../types";
import {
  buildSelectQuery,
  buildCountQuery,
  buildCreateTableSQL,
  buildCreateIndexSQL,
  buildCreateFTS5TableSQL,
  buildPopulateFTS5SQL,
  buildSearchQuery,
  buildSearchCountQuery,
} from "../utils/query-builder";
import { JOURNALIST_SCHEMA, toSqlColumnName } from "../schema/journalist-schema";

/**
 * Convert value to appropriate type based on schema field type
 * Returns value as-is (string) since D1 handles type conversion based on column definition
 */
function convertValue(value: string | null): string | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  // Return as string - D1 will convert to appropriate SQL type based on column definition
  return value;
}

/**
 * D1 Database service for managing cached Google Sheets records
 */
export class DatabaseService {
  constructor(private db: D1Database) {}

  /**
   * Initialize database schema using fixed journalist schema
   */
  async initializeSchema(): Promise<void> {
    const createTableSQL = buildCreateTableSQL(JOURNALIST_SCHEMA);
    const createIndexSQL = buildCreateIndexSQL();
    const createFTS5SQL = buildCreateFTS5TableSQL();

    // Create table
    await this.db.exec(createTableSQL);

    // Create indexes
    for (const indexSQL of createIndexSQL) {
      await this.db.exec(indexSQL);
    }

    // Create FTS5 virtual table for full-text search
    await this.db.exec(createFTS5SQL);

    // Store schema for later use
    await this.storeSchema(JOURNALIST_SCHEMA);
  }

  /**
   * Store schema in a metadata table for later retrieval
   */
  private async storeSchema(fields: typeof JOURNALIST_SCHEMA): Promise<void> {
    // Create schema metadata table if it doesn't exist
    await this.db.exec("CREATE TABLE IF NOT EXISTS _schema_metadata (id INTEGER PRIMARY KEY CHECK (id = 1), schema_json TEXT NOT NULL, updated_at TEXT NOT NULL)");

    // Store schema as JSON
    await this.db
      .prepare(`
        INSERT OR REPLACE INTO _schema_metadata (id, schema_json, updated_at)
        VALUES (1, ?, ?)
      `)
      .bind(JSON.stringify(fields), new Date().toISOString())
      .run();
  }

  /**
   * Retrieve stored schema from metadata table
   */
  async getStoredSchema(): Promise<Array<{ name: string; type: string }> | null> {
    try {
      const result = await this.db
        .prepare("SELECT schema_json FROM _schema_metadata WHERE id = 1")
        .first<{ schema_json: string }>();

      if (!result) return null;

      return JSON.parse(result.schema_json);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if database has been initialized and has records
   */
  async isInitialized(): Promise<boolean> {
    try {
      const result = await this.db
        .prepare("SELECT COUNT(*) as count FROM records")
        .first<{ count: number }>();

      return result !== null && result.count > 0;
    } catch (error) {
      // Table doesn't exist yet
      return false;
    }
  }

  /**
   * Check if table exists
   */
  async tableExists(): Promise<boolean> {
    try {
      await this.db.prepare("SELECT 1 FROM records LIMIT 1").first();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get total count of records with optional filters
   */
  async getRecordCount(params: RecordsQueryParams = {}): Promise<number> {
    const query = buildCountQuery(params);
    const result = await this.db
      .prepare(query.sql)
      .bind(...query.params)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * Get records with filtering, sorting, and pagination
   */
  async getRecords(
    params: RecordsQueryParams,
    limit: number,
    offset: number
  ): Promise<DBRecord[]> {
    const query = buildSelectQuery(params, limit, offset);
    const results = await this.db
      .prepare(query.sql)
      .bind(...query.params)
      .all<DBRecord>();

    return results.results || [];
  }

  /**
   * Get a single record by Airtable ID
   */
  async getRecordByAirtableId(airtableId: string): Promise<DBRecord | null> {
    const result = await this.db
      .prepare("SELECT * FROM records WHERE airtable_id = ?")
      .bind(airtableId)
      .first<DBRecord>();

    return result || null;
  }

  /**
   * Get a single record by ID (generic, works for both Airtable ID and row ID)
   */
  async getRecordById(id: string): Promise<DBRecord | null> {
    const result = await this.db
      .prepare("SELECT * FROM records WHERE airtable_id = ?")
      .bind(id)
      .first<DBRecord>();

    return result || null;
  }

  /**
   * Drop the records table (for full sync)
   */
  async dropTable(): Promise<void> {
    await this.db.exec("DROP TABLE IF EXISTS records");
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalRecords: number;
    oldestRecord: string | null;
    newestRecord: string | null;
  }> {
    const countResult = await this.db
      .prepare("SELECT COUNT(*) as count FROM records")
      .first<{ count: number }>();

    const oldestResult = await this.db
      .prepare("SELECT created_time FROM records ORDER BY created_time ASC LIMIT 1")
      .first<{ created_time: string }>();

    const newestResult = await this.db
      .prepare("SELECT created_time FROM records ORDER BY created_time DESC LIMIT 1")
      .first<{ created_time: string }>();

    return {
      totalRecords: countResult?.count || 0,
      oldestRecord: oldestResult?.created_time || null,
      newestRecord: newestResult?.created_time || null,
    };
  }

  /**
   * Replace all records atomically (for full table sync from Google Sheets)
   * Uses D1 batch for atomic execution - all or nothing
   * Uses fixed JOURNALIST_SCHEMA for all operations
   */
  async replaceAllRecords(
    records: Array<Record<string, string>>
  ): Promise<void> {
    if (records.length === 0) {
      throw new Error("Cannot replace with empty record set");
    }

    const schema = JOURNALIST_SCHEMA;
    const statements: D1PreparedStatement[] = [];

    // Step 1: Drop existing tables
    statements.push(this.db.prepare("DROP TABLE IF EXISTS records_fts"));
    statements.push(this.db.prepare("DROP TABLE IF EXISTS records"));

    // Step 2: Create table with new schema
    const createTableSQL = buildCreateTableSQL(schema);
    statements.push(this.db.prepare(createTableSQL));

    // Step 3: Create indexes
    const indexStatements = buildCreateIndexSQL();
    for (const indexSQL of indexStatements) {
      statements.push(this.db.prepare(indexSQL));
    }

    // Step 4: Create FTS5 virtual table
    const createFTS5SQL = buildCreateFTS5TableSQL();
    statements.push(this.db.prepare(createFTS5SQL));

    // Step 5: Insert all records (batched in chunks due to D1 limits)
    const BATCH_SIZE = 100;
    const chunks: Array<Record<string, string>[]> = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      chunks.push(records.slice(i, i + BATCH_SIZE));
    }

    // Process first chunk in initial batch
    const firstChunk = chunks[0];
    for (const record of firstChunk) {
      const columns = ["airtable_id", "created_time"];
      const values: (string | null)[] = [record.id, new Date().toISOString()];
      const placeholders = ["?", "?"];

      // Add dynamic fields from schema
      for (const field of schema) {
        const value = record[field.name];
        if (value !== undefined) {
          columns.push(toSqlColumnName(field.name));
          values.push(convertValue(value));
          placeholders.push("?");
        }
      }

      const sql = `INSERT INTO records (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      statements.push(this.db.prepare(sql).bind(...values));
    }

    // Execute first batch atomically
    await this.db.batch(statements);

    // Process remaining chunks separately (if any)
    for (let i = 1; i < chunks.length; i++) {
      const chunkStatements: D1PreparedStatement[] = [];

      for (const record of chunks[i]) {
        const columns = ["airtable_id", "created_time"];
        const values: (string | null)[] = [record.id, new Date().toISOString()];
        const placeholders = ["?", "?"];

        for (const field of schema) {
          const value = record[field.name];
          if (value !== undefined) {
            columns.push(toSqlColumnName(field.name));
            values.push(convertValue(value));
            placeholders.push("?");
          }
        }

        const sql = `INSERT INTO records (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
        chunkStatements.push(this.db.prepare(sql).bind(...values));
      }

      await this.db.batch(chunkStatements);
    }

    // Step 6: Populate FTS5 table from records table
    const populateFTS5SQL = buildPopulateFTS5SQL();
    await this.db.exec(populateFTS5SQL);
  }

  /**
   * Get records count for search query
   */
  async getSearchCount(searchQuery: string): Promise<number> {
    const query = buildSearchCountQuery(searchQuery);
    const result = await this.db
      .prepare(query.sql)
      .bind(...query.params)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * Search records using FTS5 full-text search
   */
  async searchRecords(
    searchQuery: string,
    limit: number,
    offset: number
  ): Promise<DBRecord[]> {
    const query = buildSearchQuery(searchQuery, limit, offset);
    const results = await this.db
      .prepare(query.sql)
      .bind(...query.params)
      .all<DBRecord>();

    return results.results || [];
  }

  /**
   * Get last sync timestamp from metadata
   */
  async getLastSyncTime(): Promise<string | null> {
    try {
      await this.db.exec("CREATE TABLE IF NOT EXISTS _sync_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");

      const result = await this.db
        .prepare("SELECT value FROM _sync_metadata WHERE key = ?")
        .bind("lastSyncTime")
        .first<{ value: string }>();

      return result?.value || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set last sync timestamp in metadata
   */
  async setLastSyncTime(timestamp: string): Promise<void> {
    await this.db.exec("CREATE TABLE IF NOT EXISTS _sync_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");

    await this.db
      .prepare("INSERT OR REPLACE INTO _sync_metadata (key, value, updated_at) VALUES (?, ?, ?)")
      .bind("lastSyncTime", timestamp, new Date().toISOString())
      .run();
  }
}
