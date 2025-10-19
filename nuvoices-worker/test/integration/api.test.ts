import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { env, SELF } from "cloudflare:test";
import { DatabaseService } from "../../src/services/database";
import { createJournalistRecord } from "../helpers/test-data";

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
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe", Email: "john@example.com", Years_Experience: "10" }),
        createJournalistRecord({ id: "row_3", Name: "Jane Smith", Email: "jane@example.com", Years_Experience: "5" }),
        createJournalistRecord({ id: "row_4", Name: "Bob Wilson", Email: "bob@example.com", Years_Experience: "15" }),
      ];

      await db.replaceAllRecords(records);

      const response = await SELF.fetch("http://localhost/records");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(3);
      expect(data.pagination.total).toBe(3);
      expect(data.pagination.totalPages).toBe(1);
    });

    it("should filter records by exact match", async () => {
      // Setup test data
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe", Country: "USA" }),
        createJournalistRecord({ id: "row_3", Name: "Jane Smith", Country: "Canada" }),
        createJournalistRecord({ id: "row_4", Name: "Bob Wilson", Country: "USA" }),
      ];

      await db.replaceAllRecords(records);

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
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe", Years_Experience: "10" }),
        createJournalistRecord({ id: "row_3", Name: "Jane Smith", Years_Experience: "5" }),
        createJournalistRecord({ id: "row_4", Name: "Bob Wilson", Years_Experience: "15" }),
      ];

      await db.replaceAllRecords(records);

      const response = await SELF.fetch("http://localhost/records?years_experience=>8");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it("should filter records with LIKE pattern", async () => {
      // Setup test data
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe", Email: "john@example.com" }),
        createJournalistRecord({ id: "row_3", Name: "Jane Smith", Email: "jane@test.com" }),
        createJournalistRecord({ id: "row_4", Name: "Bob Wilson", Email: "bob@example.com" }),
      ];

      await db.replaceAllRecords(records);

      const response = await SELF.fetch(
        "http://localhost/records?email=*example.com"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
    });

    it("should sort records ascending", async () => {
      // Setup test data
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe", Years_Experience: "10" }),
        createJournalistRecord({ id: "row_3", Name: "Jane Smith", Years_Experience: "5" }),
        createJournalistRecord({ id: "row_4", Name: "Bob Wilson", Years_Experience: "15" }),
      ];

      await db.replaceAllRecords(records);

      const response = await SELF.fetch(
        "http://localhost/records?sort=years_experience&order=asc"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(3);
      expect(data.data[0].years_experience).toBe(5);
      expect(data.data[1].years_experience).toBe(10);
      expect(data.data[2].years_experience).toBe(15);
    });

    it("should paginate records correctly", async () => {
      // Setup test data with 10 records
      const records = Array.from({ length: 10 }, (_, i) =>
        createJournalistRecord({
          id: `row_${i + 2}`,
          Name: `Record ${i + 1}`,
          Years_Experience: String(i + 1),
        })
      );

      await db.replaceAllRecords(records);

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
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John", Country: "USA", Years_Experience: "10" }),
        createJournalistRecord({ id: "row_3", Name: "Jane", Country: "USA", Years_Experience: "5" }),
        createJournalistRecord({ id: "row_4", Name: "Bob", Country: "Canada", Years_Experience: "15" }),
        createJournalistRecord({ id: "row_5", Name: "Alice", Country: "USA", Years_Experience: "8" }),
        createJournalistRecord({ id: "row_6", Name: "Charlie", Country: "USA", Years_Experience: "12" }),
      ];

      await db.replaceAllRecords(records);

      const response = await SELF.fetch(
        "http://localhost/records?country=USA&sort=years_experience&order=asc&page=1&limit=2"
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].years_experience).toBe(5); // Jane
      expect(data.data[1].years_experience).toBe(8); // Alice
      expect(data.pagination.total).toBe(4); // 4 USA records
    });
  });

  describe("GET /record/:id", () => {
    it("should return 404 for non-existent record", async () => {
      // Setup a database with some records first
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe", Email: "john@example.com" }),
      ];

      await db.replaceAllRecords(records);

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
      const records = [
        createJournalistRecord({ id: "row_2", Name: "John Doe", Email: "john@example.com" }),
        createJournalistRecord({ id: "row_3", Name: "Jane Smith", Email: "jane@example.com" }),
      ];

      await db.replaceAllRecords(records);

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
      const records = [
        createJournalistRecord({
          id: "row_2",
          Name: "John Doe",
          Years_Experience: "10",
          Daily_Rate_USD: "500"
        }),
      ];

      await db.replaceAllRecords(records);

      const response = await SELF.fetch("http://localhost/record/row_2");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("John Doe");
      expect(data.years_experience).toBe(10);
      expect(data.daily_rate_usd).toBe(500);
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
      const records = Array.from({ length: 150 }, (_, i) =>
        createJournalistRecord({
          id: `row_${i + 2}`,
          Name: `Record ${i}`,
          Years_Experience: String(i),
        })
      );

      await db.replaceAllRecords(records);

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
      const records = [
        createJournalistRecord({
          id: "row_2",
          Name: "Sarah Chen",
          Email: "s.chen@email.com",
          Country: "China",
          Languages: "English, Mandarin, Cantonese",
          Years_Experience: "12",
        }),
        createJournalistRecord({
          id: "row_3",
          Name: "Raj Patel",
          Email: "raj.patel@email.com",
          Country: "India",
          Languages: "English, Hindi, Marathi",
          Years_Experience: "8",
        }),
        createJournalistRecord({
          id: "row_4",
          Name: "Yuki Tanaka",
          Email: "y.tanaka@email.jp",
          Country: "Japan",
          Languages: "Japanese, English",
          Years_Experience: "10",
        }),
      ];

      await db.replaceAllRecords(records);

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
