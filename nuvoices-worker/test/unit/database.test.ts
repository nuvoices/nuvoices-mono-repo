import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { env } from "cloudflare:test";
import { DatabaseService } from "../../src/services/database";

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
    it("should initialize schema with fields", async () => {
      const fields = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      await db.initializeSchema(fields);

      // Verify table was created
      const tableExists = await db.tableExists();
      expect(tableExists).toBe(true);

      // Verify schema was stored
      const storedSchema = await db.getStoredSchema();
      expect(storedSchema).toEqual(fields);
    });

    it("should retrieve stored schema", async () => {
      const fields = [
        { name: "Name", type: "TEXT" },
        { name: "Rating", type: "REAL" },
      ];

      await db.initializeSchema(fields);
      const storedSchema = await db.getStoredSchema();

      expect(storedSchema).toEqual(fields);
    });

    it("should return null for non-existent schema", async () => {
      const schema = await db.getStoredSchema();
      expect(schema).toBeNull();
    });

    it("should update schema on re-initialization", async () => {
      const fields1 = [{ name: "Name", type: "TEXT" }];
      const fields2 = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
      ];

      await db.initializeSchema(fields1);
      await db.initializeSchema(fields2);

      const storedSchema = await db.getStoredSchema();
      expect(storedSchema).toEqual(fields2);
    });
  });

  describe("Table Operations", () => {
    it("should detect when table exists", async () => {
      const fields = [{ name: "Name", type: "TEXT" }];
      await db.initializeSchema(fields);

      const exists = await db.tableExists();
      expect(exists).toBe(true);
    });

    it("should detect when table does not exist", async () => {
      const exists = await db.tableExists();
      expect(exists).toBe(false);
    });

    it("should detect when database is initialized with data", async () => {
      const fields = [{ name: "Name", type: "TEXT" }];
      const records = [{ id: "row_2", Name: "John Doe" }];

      await db.replaceAllRecords(records, fields);

      const isInit = await db.isInitialized();
      expect(isInit).toBe(true);
    });

    it("should detect when database is not initialized", async () => {
      const isInit = await db.isInitialized();
      expect(isInit).toBe(false);
    });

    it("should detect when database has empty table", async () => {
      const fields = [{ name: "Name", type: "TEXT" }];
      await db.initializeSchema(fields);

      const isInit = await db.isInitialized();
      expect(isInit).toBe(false);
    });

    it("should drop table successfully", async () => {
      const fields = [{ name: "Name", type: "TEXT" }];
      await db.initializeSchema(fields);

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
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      const records = [
        { id: "row_2", Name: "John", Age: "30" },
        { id: "row_3", Name: "Jane", Age: "25" },
        { id: "row_4", Name: "Bob", Age: "35" },
      ];

      await db.replaceAllRecords(records, schema);

      const count = await db.getRecordCount({ age: ">25" });
      expect(count).toBe(2);
    });

    it("should get records with pagination", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];
      const records = [
        { id: "row_2", Name: "Record 1" },
        { id: "row_3", Name: "Record 2" },
        { id: "row_4", Name: "Record 3" },
        { id: "row_5", Name: "Record 4" },
        { id: "row_6", Name: "Record 5" },
      ];

      await db.replaceAllRecords(records, schema);

      const page1 = await db.getRecords({}, 2, 0);
      const page2 = await db.getRecords({}, 2, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });

    it("should get records with filters and sorting", async () => {
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      const records = [
        { id: "row_2", Name: "John", Age: "30" },
        { id: "row_3", Name: "Jane", Age: "25" },
        { id: "row_4", Name: "Bob", Age: "35" },
      ];

      await db.replaceAllRecords(records, schema);

      const results = await db.getRecords({ sort: "age", order: "asc" }, 10, 0);

      expect(results).toHaveLength(3);
      expect(results[0].age).toBe(25);
      expect(results[2].age).toBe(35);
    });

    it("should get record by Airtable ID", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];
      const records = [
        { id: "row_2", Name: "John Doe" },
        { id: "row_3", Name: "Jane Smith" },
      ];

      await db.replaceAllRecords(records, schema);

      const record = await db.getRecordByAirtableId("row_2");

      expect(record).not.toBeNull();
      expect(record?.airtable_id).toBe("row_2");
      expect(record?.name).toBe("John Doe");
    });

    it("should return null for non-existent record", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];
      const records = [{ id: "row_2", Name: "John Doe" }];

      await db.replaceAllRecords(records, schema);

      const record = await db.getRecordByAirtableId("row_999");
      expect(record).toBeNull();
    });

    it("should get record by ID (generic method)", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];
      const records = [{ id: "row_2", Name: "John Doe" }];

      await db.replaceAllRecords(records, schema);

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
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Created", type: "TEXT" },
      ];

      const records = [
        { id: "row_2", Name: "Record 1", Created: "2025-01-15T10:00:00.000Z" },
        { id: "row_3", Name: "Record 2", Created: "2025-01-15T11:00:00.000Z" },
        { id: "row_4", Name: "Record 3", Created: "2025-01-15T12:00:00.000Z" },
      ];

      await db.replaceAllRecords(records, schema);

      const stats = await db.getStats();

      expect(stats.totalRecords).toBe(3);
      // Note: created_time is auto-generated by database, not from data
    });

    it("should get statistics for empty database", async () => {
      const schema = [{ name: "Name", type: "TEXT" }];
      await db.initializeSchema(schema);

      const stats = await db.getStats();

      expect(stats.totalRecords).toBe(0);
      expect(stats.oldestRecord).toBeNull();
      expect(stats.newestRecord).toBeNull();
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle records with optional fields", async () => {
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
        { name: "Phone", type: "TEXT" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Email: "john@example.com" },
        { id: "row_3", Name: "Jane Smith", Phone: "+1-555-1234" },
      ];

      await db.replaceAllRecords(records, schema);

      const record1 = await db.getRecordById("row_2");
      const record2 = await db.getRecordById("row_3");

      expect(record1?.email).toBe("john@example.com");
      expect(record1?.phone).toBeNull();

      expect(record2?.phone).toBe("+1-555-1234");
      expect(record2?.email).toBeNull();
    });

    it("should handle records with special characters in field names", async () => {
      const schema = [
        { name: "First Name", type: "TEXT" },
        { name: "Email Address", type: "TEXT" },
      ];

      const records = [
        {
          id: "row_2",
          "First Name": "John Doe",
          "Email Address": "john@example.com",
        },
      ];

      await db.replaceAllRecords(records, schema);

      const count = await db.getRecordCount();
      expect(count).toBe(1);
    });

    it("should handle multiple data types in same table", async () => {
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
        { name: "Rating", type: "REAL" },
        { name: "Active", type: "TEXT" },
      ];

      const records = [
        {
          id: "row_2",
          Name: "John Doe",
          Age: "30",
          Rating: "4.5",
          Active: "Yes",
        },
      ];

      await db.replaceAllRecords(records, schema);

      const record = await db.getRecordById("row_2");

      expect(record?.name).toBe("John Doe");
      expect(record?.age).toBe(30);
      expect(record?.rating).toBe(4.5);
      expect(record?.active).toBe("Yes");
    });
  });
});
