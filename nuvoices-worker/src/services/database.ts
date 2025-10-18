import type { DBRecord, RecordsQueryParams } from "../types";
import {
  buildSelectQuery,
  buildCountQuery,
  buildCreateTableSQL,
  buildCreateIndexSQL,
} from "../utils/query-builder";

/**
 * Convert value to appropriate type based on schema field type
 * Note: We still pass strings to D1, but D1 will store them with proper types
 * When queried back, D1 may return them as strings depending on the HTTP API serialization
 */
function convertValue(value: string, type: string): string | null {
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
   * Initialize database schema based on Google Sheets fields
   */
  async initializeSchema(
    fields: Array<{ name: string; type: string }>
  ): Promise<void> {
    const createTableSQL = buildCreateTableSQL(fields);
    const createIndexSQL = buildCreateIndexSQL();

    // Create table
    await this.db.exec(createTableSQL);

    // Create indexes
    for (const indexSQL of createIndexSQL) {
      await this.db.exec(indexSQL);
    }

    // Store schema for later use
    await this.storeSchema(fields);
  }

  /**
   * Store schema in a metadata table for later retrieval
   */
  private async storeSchema(fields: Array<{ name: string; type: string }>): Promise<void> {
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
   */
  async replaceAllRecords(
    records: Array<Record<string, string>>,
    schema: Array<{ name: string; type: string }>
  ): Promise<void> {
    if (records.length === 0) {
      throw new Error("Cannot replace with empty record set");
    }

    const statements: D1PreparedStatement[] = [];

    // Step 1: Drop existing table
    statements.push(this.db.prepare("DROP TABLE IF EXISTS records"));

    // Step 2: Create table with new schema
    const createTableSQL = buildCreateTableSQL(schema);
    statements.push(this.db.prepare(createTableSQL));

    // Step 3: Create indexes
    const indexStatements = buildCreateIndexSQL();
    for (const indexSQL of indexStatements) {
      statements.push(this.db.prepare(indexSQL));
    }

    // Step 4: Insert all records (batched in chunks due to D1 limits)
    const BATCH_SIZE = 100;
    const chunks: Array<Record<string, string>[]> = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      chunks.push(records.slice(i, i + BATCH_SIZE));
    }

    // Process first chunk in initial batch
    const firstChunk = chunks[0];
    for (const record of firstChunk) {
      const columns = ["airtable_id", "created_time"];
      const values = [record.id, new Date().toISOString()];
      const placeholders = ["?", "?"];

      // Add dynamic fields from schema
      for (const field of schema) {
        const value = record[field.name];
        if (value !== undefined) {
          columns.push(field.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
          values.push(convertValue(value, field.type));
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
        const values = [record.id, new Date().toISOString()];
        const placeholders = ["?", "?"];

        for (const field of schema) {
          const value = record[field.name];
          if (value !== undefined) {
            columns.push(field.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
            values.push(convertValue(value, field.type));
            placeholders.push("?");
          }
        }

        const sql = `INSERT INTO records (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
        chunkStatements.push(this.db.prepare(sql).bind(...values));
      }

      await this.db.batch(chunkStatements);
    }
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
