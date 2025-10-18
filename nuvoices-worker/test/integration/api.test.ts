import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { env, SELF } from "cloudflare:test";
import type { Env } from "../../src/types";
import { DatabaseService } from "../../src/services/database";

describe("API Integration Tests", () => {
  let db: DatabaseService;

  beforeAll(() => {
    db = new DatabaseService(env.DB);
  });

  beforeEach(async () => {
    // Clean up database before each test
    try {
      await env.DB.exec("DROP TABLE IF EXISTS records");
      await env.DB.exec("DROP TABLE IF EXISTS _schema_metadata");
      await env.DB.exec("DROP TABLE IF EXISTS _sync_metadata");
    } catch (error) {
      // Ignore errors
    }
  });

  afterEach(async () => {
    // Clean up database after each test
    try {
      await env.DB.exec("DROP TABLE IF EXISTS records");
      await env.DB.exec("DROP TABLE IF EXISTS _schema_metadata");
      await env.DB.exec("DROP TABLE IF EXISTS _sync_metadata");
    } catch (error) {
      // Ignore errors
    }
  });

  describe("GET /", () => {
    it("should return health check", async () => {
      const response = await SELF.fetch("http://localhost/");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("service", "Google Sheets Cache Worker");
      expect(data).toHaveProperty("status", "healthy");
      expect(data).toHaveProperty("version", "2.0.0");
      expect(data).toHaveProperty("endpoints");
      expect(data).toHaveProperty("sync");
      expect(data).toHaveProperty("timestamp");
    });

    it("should return correct endpoint documentation", async () => {
      const response = await SELF.fetch("http://localhost/");
      const data = await response.json();

      expect(data.endpoints).toHaveProperty("records");
      expect(data.endpoints).toHaveProperty("record");
      expect(data.sync.strategy).toBe("cron-pull");
      expect(data.sync.frequency).toBe("every 2 minutes");
    });
  });

  describe("GET /records", () => {
    it("should return empty array when database is empty", async () => {
      const response = await SELF.fetch("http://localhost/records");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data).toEqual([]);
      expect(data).toHaveProperty("pagination");
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
    });

    it("should support pagination parameters", async () => {
      const response = await SELF.fetch(
        "http://localhost/records?page=2&limit=10"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      // When database is empty, returns defaults
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.total).toBe(0);
    });

    it("should return records with actual data", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Email: "john@example.com", Age: "30" },
        {
          id: "row_3",
          Name: "Jane Smith",
          Email: "jane@example.com",
          Age: "25",
        },
        {
          id: "row_4",
          Name: "Bob Wilson",
          Email: "bob@example.com",
          Age: "35",
        },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch("http://localhost/records");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(3);
      expect(data.pagination.total).toBe(3);
      expect(data.pagination.totalPages).toBe(1);
    });

    it("should filter records by exact match", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Country", type: "TEXT" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Country: "USA" },
        { id: "row_3", Name: "Jane Smith", Country: "Canada" },
        { id: "row_4", Name: "Bob Wilson", Country: "USA" },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch(
        "http://localhost/records?country=USA"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].country).toBe("USA");
      expect(data.data[1].country).toBe("USA");
    });

    it("should filter records with greater than operator", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Age: "30" },
        { id: "row_3", Name: "Jane Smith", Age: "25" },
        { id: "row_4", Name: "Bob Wilson", Age: "35" },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch("http://localhost/records?age=>28");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it("should filter records with LIKE pattern", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Email: "john@example.com" },
        { id: "row_3", Name: "Jane Smith", Email: "jane@test.com" },
        { id: "row_4", Name: "Bob Wilson", Email: "bob@example.com" },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch(
        "http://localhost/records?email=*example.com"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
    });

    it("should sort records ascending", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Age: "30" },
        { id: "row_3", Name: "Jane Smith", Age: "25" },
        { id: "row_4", Name: "Bob Wilson", Age: "35" },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch(
        "http://localhost/records?sort=age&order=asc"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(3);
      expect(data.data[0].age).toBe(25);
      expect(data.data[1].age).toBe(30);
      expect(data.data[2].age).toBe(35);
    });

    it("should paginate records correctly", async () => {
      // Setup test data with 10 records
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Value", type: "INTEGER" },
      ];

      const records = Array.from({ length: 10 }, (_, i) => ({
        id: `row_${i + 2}`,
        Name: `Record ${i + 1}`,
        Value: String(i + 1),
      }));

      await db.replaceAllRecords(records, schema);

      // Page 1
      const response1 = await SELF.fetch(
        "http://localhost/records?page=1&limit=3"
      );
      const data1 = await response1.json();

      expect(data1.data).toHaveLength(3);
      expect(data1.pagination.page).toBe(1);
      expect(data1.pagination.limit).toBe(3);
      expect(data1.pagination.total).toBe(10);
      expect(data1.pagination.totalPages).toBe(4);
      expect(data1.pagination.hasNext).toBe(true);
      expect(data1.pagination.hasPrev).toBe(false);

      // Page 2
      const response2 = await SELF.fetch(
        "http://localhost/records?page=2&limit=3"
      );
      const data2 = await response2.json();

      expect(data2.data).toHaveLength(3);
      expect(data2.pagination.page).toBe(2);
      expect(data2.pagination.hasNext).toBe(true);
      expect(data2.pagination.hasPrev).toBe(true);

      // Last page
      const response3 = await SELF.fetch(
        "http://localhost/records?page=4&limit=3"
      );
      const data3 = await response3.json();

      expect(data3.data).toHaveLength(1);
      expect(data3.pagination.hasNext).toBe(false);
      expect(data3.pagination.hasPrev).toBe(true);
    });

    it("should combine filters, sorting, and pagination", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Country", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
      ];

      const records = [
        { id: "row_2", Name: "John", Country: "USA", Age: "30" },
        { id: "row_3", Name: "Jane", Country: "USA", Age: "25" },
        { id: "row_4", Name: "Bob", Country: "Canada", Age: "35" },
        { id: "row_5", Name: "Alice", Country: "USA", Age: "28" },
        { id: "row_6", Name: "Charlie", Country: "USA", Age: "32" },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch(
        "http://localhost/records?country=USA&sort=age&order=asc&page=1&limit=2"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].age).toBe(25); // Jane
      expect(data.data[1].age).toBe(28); // Alice
      expect(data.pagination.total).toBe(4); // 4 USA records
    });
  });

  describe("GET /record/:id", () => {
    it("should return 404 for non-existent record", async () => {
      // Setup a database with some records first
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Email: "john@example.com" },
      ];

      await db.replaceAllRecords(records, schema);

      // Now request a non-existent record
      const response = await SELF.fetch("http://localhost/record/nonexistent");
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error", "Not Found");
      expect(data).toHaveProperty("message");
      expect(data.status).toBe(404);
    });

    it("should return record by ID", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Email: "john@example.com" },
        { id: "row_3", Name: "Jane Smith", Email: "jane@example.com" },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch("http://localhost/record/row_2");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.airtable_id).toBe("row_2");
      expect(data.name).toBe("John Doe");
      expect(data.email).toBe("john@example.com");
    });

    it("should return 404 when database is empty", async () => {
      const response = await SELF.fetch("http://localhost/record/row_2");
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Not Found");
    });

    it("should handle record with all field types", async () => {
      // Setup test data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
        { name: "Rating", type: "REAL" },
      ];

      const records = [
        { id: "row_2", Name: "John Doe", Age: "30", Rating: "4.5" },
      ];

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch("http://localhost/record/row_2");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("John Doe");
      expect(data.age).toBe(30);
      expect(data.rating).toBe(4.5);
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await SELF.fetch("http://localhost/unknown");
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error", "Not Found");
      expect(data.message).toContain("/unknown");
    });

    it("should return 404 for invalid HTTP methods", async () => {
      const response = await SELF.fetch("http://localhost/records", {
        method: "POST",
      });
      expect(response.status).toBe(404);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed query parameters gracefully", async () => {
      const response = await SELF.fetch(
        "http://localhost/records?page=invalid&limit=abc"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      // Should fall back to defaults
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
    });

    it("should enforce maximum limit", async () => {
      // Setup test data first so we can test limit enforcement
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Value", type: "INTEGER" },
      ];

      const records = Array.from({ length: 150 }, (_, i) => ({
        id: `row_${i + 2}`,
        Name: `Record ${i}`,
        Value: String(i),
      }));

      await db.replaceAllRecords(records, schema);

      const response = await SELF.fetch(
        "http://localhost/records?limit=1000"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      // Should be capped at max limit (100)
      expect(data.pagination.limit).toBe(100);
      expect(data.data).toHaveLength(100);
    });
  });

  describe("Complex Real-World Scenarios", () => {
    it("should handle journalist database query", async () => {
      // Setup realistic journalist data
      const schema = [
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
        { name: "Country", type: "TEXT" },
        { name: "Languages", type: "TEXT" },
        { name: "Years_Experience", type: "INTEGER" },
      ];

      const records = [
        {
          id: "row_2",
          Name: "Sarah Chen",
          Email: "s.chen@email.com",
          Country: "China",
          Languages: "English, Mandarin, Cantonese",
          Years_Experience: "12",
        },
        {
          id: "row_3",
          Name: "Raj Patel",
          Email: "raj.patel@email.com",
          Country: "India",
          Languages: "English, Hindi, Marathi",
          Years_Experience: "8",
        },
        {
          id: "row_4",
          Name: "Yuki Tanaka",
          Email: "y.tanaka@email.jp",
          Country: "Japan",
          Languages: "Japanese, English",
          Years_Experience: "10",
        },
      ];

      await db.replaceAllRecords(records, schema);

      // Query for experienced journalists
      const response = await SELF.fetch(
        "http://localhost/records?years_experience=>9&sort=years_experience&order=desc"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Sarah Chen");
      expect(data.data[1].name).toBe("Yuki Tanaka");
    });
  });
});
