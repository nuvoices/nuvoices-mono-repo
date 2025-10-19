import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { env } from "cloudflare:test";
import { DatabaseService } from "../../src/services/database";
import { JOURNALIST_SCHEMA } from "../../src/schema/journalist-schema";
import { createJournalistRecord, createJournalistRecords } from "../helpers/test-data";

describe("Database Service", () => {
  let db: DatabaseService;

  beforeAll(() => {
    db = new DatabaseService(env.DB);
  });

  afterEach(async () => {
    // Clean up database after each test
    try {
      await env.DB.exec("DROP TABLE IF EXISTS records");
      await env.DB.exec("DROP TABLE IF EXISTS _schema_metadata");
      await env.DB.exec("DROP TABLE IF EXISTS _sync_metadata");
    } catch (error) {
      // Ignore errors if tables don't exist
    }
  });

  describe("Schema Management", () => {
    it("should initialize schema with journalist fields", async () => {
      await db.initializeSchema();

      // Verify table was created
      const tableExists = await db.tableExists();
      expect(tableExists).toBe(true);

      // Verify schema was stored (should match JOURNALIST_SCHEMA)
      const storedSchema = await db.getStoredSchema();
      expect(storedSchema).toEqual(JOURNALIST_SCHEMA);
    });

    it("should retrieve stored schema", async () => {
      await db.initializeSchema();
      const storedSchema = await db.getStoredSchema();

      // Should match JOURNALIST_SCHEMA
      expect(storedSchema).toEqual(JOURNALIST_SCHEMA);
      expect(storedSchema).toHaveLength(15); // 15 fields in journalist schema
    });

    it("should return null for non-existent schema", async () => {
      const schema = await db.getStoredSchema();
      expect(schema).toBeNull();
    });

    it("should store same schema on re-initialization", async () => {
      await db.initializeSchema();
      await db.initializeSchema();

      const storedSchema = await db.getStoredSchema();
      // Should still be JOURNALIST_SCHEMA (idempotent)
      expect(storedSchema).toEqual(JOURNALIST_SCHEMA);
    });
  });

  describe("Table Operations", () => {
    it("should detect when table exists", async () => {
      await db.initializeSchema();

      const exists = await db.tableExists();
      expect(exists).toBe(true);
    });

    it("should detect when table does not exist", async () => {
      const exists = await db.tableExists();
      expect(exists).toBe(false);
    });

    it("should detect when database is initialized with data", async () => {
      const records = [createJournalistRecord()];

      await db.replaceAllRecords(records);

      const isInit = await db.isInitialized();
      expect(isInit).toBe(true);
    });

    it("should detect when database is not initialized", async () => {
      const isInit = await db.isInitialized();
      expect(isInit).toBe(false);
    });

    it("should detect when database has empty table", async () => {
      await db.initializeSchema();

      const isInit = await db.isInitialized();
      expect(isInit).toBe(false);
    });

    it("should drop table successfully", async () => {
      await db.initializeSchema();

      await db.dropTable();

      const exists = await db.tableExists();
      expect(exists).toBe(false);
    });
  });

  describe("Record Operations", () => {
    it("should replace all records atomically", async () => {
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Email: "john@example.com", Age: "30" },
        { id: "row_3", Name: "Jane Smith", Email: "jane@example.com", Age: "25" },
      ];

      await db.replaceAllRecords(records, schema);

      const count = await db.getRecordCount();
      expect(count).toBe(2);
    });

    it("should handle large batch of records", async () => {
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Value", type: "INTEGER" },
      ];

      // Create 150 records to test batching (batch size is 100)
      const records = Array.from({ length: 150 }, (_, i) => ({
        id: `row_${i + 2}`,
        Name: `Record ${i}`,
        Value: String(i),
      }));

      await db.replaceAllRecords(records, schema);

      const count = await db.getRecordCount();
      expect(count).toBe(150);
    });

    it("should throw error when replacing with empty records", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];
      const records: any[] = [];

      await expect(db.replaceAllRecords(records, schema)).rejects.toThrow(
        "Cannot replace with empty record set"
      );
    });

    it("should replace existing data with new data", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];

      const records1 = [
        { id: "row_2", Name: "Old Data 1" },
        { id: "row_3", Name: "Old Data 2" },
      ];

      const records2 = [{ id: "row_2", Name: "New Data" }];

      await db.replaceAllRecords(records1, schema);
      await db.replaceAllRecords(records2, schema);

      const count = await db.getRecordCount();
      expect(count).toBe(1);

      const record = await db.getRecordById("row_2");
      expect(record?.name).toBe("New Data");
    });

    it("should get record count with no filters", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];
      const records = [
        { id: "row_2", Name: "John" },
        { id: "row_3", Name: "Jane" },
        { id: "row_4", Name: "Bob" },
      ];

      await db.replaceAllRecords(records, schema);

      const count = await db.getRecordCount();
      expect(count).toBe(3);
    });

    it("should get record count with filters", async () => {
      const records = [
        createJournalistRecord({ id: "row_2", Years_Experience: "10" }),
        createJournalistRecord({ id: "row_3", Years_Experience: "5" }),
        createJournalistRecord({ id: "row_4", Years_Experience: "15" }),
      ];

      await db.replaceAllRecords(records);

      const count = await db.getRecordCount({ years_experience: ">5" });
      expect(count).toBe(2);
    });

    it("should get records with pagination", async () => {
      const records = [
        createJournalistRecord({ id: "row_2", Name: "Record 1" }),
        createJournalistRecord({ id: "row_3", Name: "Record 2" }),
        createJournalistRecord({ id: "row_4", Name: "Record 3" }),
        createJournalistRecord({ id: "row_5", Name: "Record 4" }),
        createJournalistRecord({ id: "row_6", Name: "Record 5" }),
      ];

      await db.replaceAllRecords(records);

      const page1 = await db.getRecords({}, 2, 0);
      const page2 = await db.getRecords({}, 2, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });

    it("should get records with filters and sorting", async () => {
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John", Years_Experience: "10" }),
        createJournalistRecord({ id: "row_3", Name: "Jane", Years_Experience: "5" }),
        createJournalistRecord({ id: "row_4", Name: "Bob", Years_Experience: "15" }),
      ];

      await db.replaceAllRecords(records);

      const results = await db.getRecords({ sort: "years_experience", order: "asc" }, 10, 0);

      expect(results).toHaveLength(3);
      expect(results[0].years_experience).toBe(5);
      expect(results[2].years_experience).toBe(15);
    });

    it("should get record by Airtable ID", async () => {
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe" }),
        createJournalistRecord({ id: "row_3", Name: "Jane Smith" }),
      ];

      await db.replaceAllRecords(records);

      const record = await db.getRecordByAirtableId("row_2");

      expect(record).not.toBeNull();
      expect(record?.airtable_id).toBe("row_2");
      expect(record?.name).toBe("John Doe");
    });

    it("should return null for non-existent record", async () => {
      const records = [createJournalistRecord({ id: "row_2", Name: "John Doe" })];

      await db.replaceAllRecords(records);

      const record = await db.getRecordByAirtableId("row_999");
      expect(record).toBeNull();
    });

    it("should get record by ID (generic method)", async () => {
      const records = [createJournalistRecord({ id: "row_2", Name: "John Doe" })];

      await db.replaceAllRecords(records);

      const record = await db.getRecordById("row_2");

      expect(record).not.toBeNull();
      expect(record?.name).toBe("John Doe");
    });
  });

  describe("Sync Metadata", () => {
    it("should set and get last sync time", async () => {
      const timestamp = "2025-01-15T10:30:00.000Z";

      await db.setLastSyncTime(timestamp);
      const retrieved = await db.getLastSyncTime();

      expect(retrieved).toBe(timestamp);
    });

    it("should return null when no sync time exists", async () => {
      const syncTime = await db.getLastSyncTime();
      expect(syncTime).toBeNull();
    });

    it("should update existing sync time", async () => {
      const timestamp1 = "2025-01-15T10:30:00.000Z";
      const timestamp2 = "2025-01-15T11:45:00.000Z";

      await db.setLastSyncTime(timestamp1);
      await db.setLastSyncTime(timestamp2);

      const retrieved = await db.getLastSyncTime();
      expect(retrieved).toBe(timestamp2);
    });
  });

  describe("Database Statistics", () => {
    it("should get statistics for populated database", async () => {
      const records = [
        createJournalistRecord({ id: "row_2", Name: "Record 1" }),
        createJournalistRecord({ id: "row_3", Name: "Record 2" }),
        createJournalistRecord({ id: "row_4", Name: "Record 3" }),
      ];

      await db.replaceAllRecords(records);

      const stats = await db.getStats();

      expect(stats.totalRecords).toBe(3);
      // Note: created_time is auto-generated by database, not from data
    });

    it("should get statistics for empty database", async () => {
      await db.initializeSchema();

      const stats = await db.getStats();

      expect(stats.totalRecords).toBe(0);
      expect(stats.oldestRecord).toBeNull();
      expect(stats.newestRecord).toBeNull();
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle records with optional fields", async () => {
      // Create base records and override specific fields
      const baseRecord1 = createJournalistRecord({ id: "row_2", Name: "John Doe", Email: "john@example.com" });
      const baseRecord2 = createJournalistRecord({ id: "row_3", Name: "Jane Smith", Phone: "+1-555-5678" });

      const records = [baseRecord1, baseRecord2];

      await db.replaceAllRecords(records);

      const record1 = await db.getRecordById("row_2");
      const record2 = await db.getRecordById("row_3");

      expect(record1?.email).toBe("john@example.com");
      expect(record1?.phone).toBe("+1-555-0000"); // Default value from helper

      expect(record2?.phone).toBe("+1-555-5678"); // Overridden value
      expect(record2?.email).toBe("test@example.com"); // Default value from helper
    });

    it("should handle journalist records with all fields", async () => {
      const records = [
        createJournalistRecord({
          id: "row_2",
          Name: "John Doe",
          Email: "john@example.com",
          LinkedIn_Profile: "linkedin.com/in/johndoe",
          Years_Experience: "10",
          Daily_Rate_USD: "500",
        }),
      ];

      await db.replaceAllRecords(records);

      const count = await db.getRecordCount();
      expect(count).toBe(1);

      const record = await db.getRecordById("row_2");
      expect(record?.linkedin_profile).toBe("linkedin.com/in/johndoe");
      expect(record?.years_experience).toBe(10);
      expect(record?.daily_rate_usd).toBe(500);
    });

    it("should handle multiple data types in same table", async () => {
      const records = [
        createJournalistRecord({
          id: "row_2",
          Name: "John Doe",
          Years_Experience: "10",
          Daily_Rate_USD: "500",
          Available_For_Live: "Yes",
        }),
      ];

      await db.replaceAllRecords(records);

      const record = await db.getRecordById("row_2");

      // TEXT fields should remain as strings
      expect(record?.name).toBe("John Doe");
      expect(record?.available_for_live).toBe("Yes");

      // INTEGER fields should be converted to numbers
      expect(record?.years_experience).toBe(10);
      expect(record?.daily_rate_usd).toBe(500);
    });
  });
});
