import type { AirtableRecord, DBRecord, RecordsQueryParams } from "../types";
import {
  buildSelectQuery,
  buildCountQuery,
  buildCreateTableSQL,
  buildCreateIndexSQL,
} from "../utils/query-builder";
import { prepareFieldValues } from "../utils/field-processor";
import type { AirtableService } from "./airtable";

/**
 * D1 Database service for managing cached Airtable records
 */
export class DatabaseService {
  constructor(private db: D1Database) {}

  /**
   * Initialize database schema based on Airtable fields
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
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS _schema_metadata (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

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
   * Initialize database from Airtable (consolidates initialization logic)
   */
  async initializeFromAirtable(airtable: AirtableService): Promise<{ recordCount: number }> {
    const records = await airtable.getAllRecords();

    if (records.length === 0) {
      throw new Error("No records available in Airtable for initialization");
    }

    const schema = await airtable.inferSchemaFromRecords(records);
    await this.initializeSchema(schema.fields);
    await this.bulkInsertRecords(records, schema.fields);

    return { recordCount: records.length };
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
   * Insert a single record from Airtable
   */
  async insertRecord(record: AirtableRecord, fields: Array<{ name: string; type: string }>): Promise<void> {
    const columns = ["airtable_id", "created_time"];
    const values = [record.id, record.createdTime];
    const placeholders = ["?", "?"];

    // Add dynamic field columns using helper
    const processed = prepareFieldValues(record, fields);
    columns.push(...processed.columns);
    values.push(...processed.values);
    placeholders.push(...processed.placeholders);

    const sql = `
      INSERT OR REPLACE INTO records (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
    `;

    await this.db.prepare(sql).bind(...values).run();
  }

  /**
   * Bulk insert records from Airtable (more efficient for initial sync)
   * Handles large datasets by chunking into batches
   */
  async bulkInsertRecords(
    records: AirtableRecord[],
    fields: Array<{ name: string; type: string }>
  ): Promise<void> {
    if (records.length === 0) return;

    const BATCH_SIZE = 100; // D1 batch limit safety

    // Process records in chunks
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);
      const statements: D1PreparedStatement[] = [];

      for (const record of chunk) {
        const columns = ["airtable_id", "created_time"];
        const values = [record.id, record.createdTime];
        const placeholders = ["?", "?"];

        // Add dynamic field columns using helper
        const processed = prepareFieldValues(record, fields);
        columns.push(...processed.columns);
        values.push(...processed.values);
        placeholders.push(...processed.placeholders);

        const sql = `
          INSERT OR REPLACE INTO records (${columns.join(", ")})
          VALUES (${placeholders.join(", ")})
        `;

        statements.push(this.db.prepare(sql).bind(...values));
      }

      // Execute batch
      await this.db.batch(statements);
    }
  }

  /**
   * Update an existing record
   */
  async updateRecord(
    airtableId: string,
    record: AirtableRecord,
    fields: Array<{ name: string; type: string }>
  ): Promise<void> {
    const setClauses: string[] = ["last_modified_time = ?"];
    const values = [new Date().toISOString()];

    // Add dynamic field updates using helper
    const processed = prepareFieldValues(record, fields);
    for (let i = 0; i < processed.columns.length; i++) {
      setClauses.push(`${processed.columns[i]} = ?`);
      values.push(processed.values[i]);
    }

    values.push(airtableId);

    const sql = `
      UPDATE records
      SET ${setClauses.join(", ")}
      WHERE airtable_id = ?
    `;

    await this.db.prepare(sql).bind(...values).run();
  }

  /**
   * Delete a record by Airtable ID
   */
  async deleteRecord(airtableId: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM records WHERE airtable_id = ?")
      .bind(airtableId)
      .run();
  }

  /**
   * Delete multiple records
   */
  async deleteRecords(airtableIds: string[]): Promise<void> {
    if (airtableIds.length === 0) return;

    const statements = airtableIds.map((id) =>
      this.db.prepare("DELETE FROM records WHERE airtable_id = ?").bind(id)
    );

    await this.db.batch(statements);
  }

  /**
   * Clear all records from the table (useful for full refresh)
   */
  async clearAllRecords(): Promise<void> {
    await this.db.prepare("DELETE FROM records").run();
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
}
