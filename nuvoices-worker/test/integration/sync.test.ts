import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { env } from "cloudflare:test";
import { syncFromGoogleSheets } from "../../src/services/sync";
import { DatabaseService } from "../../src/services/database";
import type { Env } from "../../src/types";
import { createJournalistCSV, SINGLE_JOURNALIST_CSV, SIMPLE_JOURNALIST_CSV, MOCK_SHEETS_CSV_SUBSET } from "../helpers/csv-data";

describe("Sync Service Integration Tests", () => {
  let db: DatabaseService;
  let mockEnv: Env;

  beforeEach(() => {
    db = new DatabaseService(env.DB);
    mockEnv = {
      DB: env.DB,
      TIMESTAMP_URL: "https://example.com/timestamp",
      CSV_URL: "https://example.com/csv",
    };
  });

  afterEach(async () => {
    // Clean up database
    try {
      await env.DB.exec("DROP TABLE IF EXISTS records");
      await env.DB.exec("DROP TABLE IF EXISTS _schema_metadata");
      await env.DB.exec("DROP TABLE IF EXISTS _sync_metadata");
    } catch (error) {
      // Ignore errors
    }

    // Clear mocks
    vi.restoreAllMocks();
  });

  describe("Full Sync Workflow", () => {
    it("should perform initial sync successfully", async () => {
      // Mock fetch for timestamp endpoint
      const timestampResponse = {
        spreadsheetId: "test-sheet-id",
        lastUpdated: "2025-01-15T10:30:00.000Z",
      };

      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(timestampResponse),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(MOCK_SHEETS_CSV_SUBSET),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      // Verify records were synced
      const count = await db.getRecordCount();
      expect(count).toBe(5); // Based on embedded CSV data

      // Verify last sync time was updated
      const lastSync = await db.getLastSyncTime();
      expect(lastSync).toBe("2025-01-15T10:30:00.000Z");

      // Verify data integrity - check first record
      const firstRecord = await db.getRecordById("row_2");
      expect(firstRecord).not.toBeNull();
      expect(firstRecord?.name).toBe("Sarah Chen");
      expect(firstRecord?.email).toBe("s.chen.reporter@email.com");
    });

    it("should skip sync when timestamp unchanged", async () => {
      const timestamp = "2025-01-15T10:30:00.000Z";

      // Set initial sync time
      await db.setLastSyncTime(timestamp);

      // Mock fetch to return same timestamp
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: timestamp,
              }),
          } as Response);
        }
        return Promise.reject(new Error("Unexpected fetch call"));
      });

      await syncFromGoogleSheets(mockEnv);

      // Verify CSV was not fetched
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(mockEnv.TIMESTAMP_URL);
    });

    it("should sync when timestamp changed", async () => {
      const oldTimestamp = "2025-01-15T10:00:00.000Z";
      const newTimestamp = "2025-01-15T11:00:00.000Z";

      // Set old sync time
      await db.setLastSyncTime(oldTimestamp);

      // Mock fetch with new timestamp
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: newTimestamp,
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(MOCK_SHEETS_CSV_SUBSET),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      // Verify new sync time was updated
      const lastSync = await db.getLastSyncTime();
      expect(lastSync).toBe(newTimestamp);

      // Verify CSV was fetched
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should replace old data with new data", async () => {
      // First sync with mock data
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T10:00:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(MOCK_SHEETS_CSV_SUBSET),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      const initialCount = await db.getRecordCount();
      expect(initialCount).toBe(5);

      // Second sync with different data
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T11:00:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(SINGLE_JOURNALIST_CSV),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      // Verify old data was replaced
      const newCount = await db.getRecordCount();
      expect(newCount).toBe(1);

      const record = await db.getRecordById("row_2");
      expect(record?.name).toBe("New Person");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when timestamp fetch fails", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response)
      );

      await expect(syncFromGoogleSheets(mockEnv)).rejects.toThrow(
        "Failed to fetch timestamp"
      );
    });

    it("should throw error when timestamp response missing lastUpdated", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ spreadsheetId: "test" }),
        } as Response)
      );

      await expect(syncFromGoogleSheets(mockEnv)).rejects.toThrow(
        "Invalid timestamp response: missing lastUpdated field"
      );
    });

    it("should throw error when CSV fetch fails", async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T10:30:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await expect(syncFromGoogleSheets(mockEnv)).rejects.toThrow(
        "Failed to fetch CSV"
      );
    });

    it("should throw error when CSV data is empty", async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T10:30:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(""),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await expect(syncFromGoogleSheets(mockEnv)).rejects.toThrow(
        "CSV data is empty"
      );
    });

    it("should keep old data intact when sync fails", async () => {
      // First successful sync
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T10:00:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(MOCK_SHEETS_CSV_SUBSET),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      const initialCount = await db.getRecordCount();
      expect(initialCount).toBe(5);

      // Second sync fails
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T11:00:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      // Expect sync to fail
      await expect(syncFromGoogleSheets(mockEnv)).rejects.toThrow();

      // Verify old data is still intact
      const countAfterError = await db.getRecordCount();
      expect(countAfterError).toBe(5);
    });
  });

  describe("Schema Validation and Data Types", () => {
    it.only("should validate CSV against strict journalist schema", async () => {
      // Use journalist CSV with proper fields
      const journalistCSV = createJournalistCSV([
        { Name: "John Doe", Email: "john@example.com", Country: "USA", Years_Experience: "10", Daily_Rate_USD: "500" },
        { Name: "Jane Smith", Email: "jane@example.com", Country: "UK", Years_Experience: "8", Daily_Rate_USD: "450" }
      ]);

      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T10:30:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(journalistCSV),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      // Verify strict schema was stored
      const schema = await db.getStoredSchema();
      console.log('schema', schema)
      expect(schema).toBeDefined();
      expect(schema).toHaveLength(15); // 15 fields in JOURNALIST_SCHEMA

      // Check record to verify type transformations
      const record = await db.getRecordById("row_2");
      expect(record?.name).toBe("John Doe");
      expect(record?.years_experience).toBe(10); // INTEGER - transformed from string
      expect(record?.daily_rate_usd).toBe(500); // INTEGER - transformed from string
      expect(record?.email).toBe("john@example.com"); // TEXT
    });

    it("should handle complex CSV with many fields", async () => {
      // Use the full mock CSV with 15 fields
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T10:30:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(MOCK_SHEETS_CSV_SUBSET),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      // Verify all 5 records synced
      const count = await db.getRecordCount();
      expect(count).toBe(5);

      // Spot-check a few records for data integrity
      const sarah = await db.getRecordById("row_2");
      expect(sarah?.name).toBe("Sarah Chen");
      expect(sarah?.country).toBe("China");
      expect(sarah?.languages).toBe("English, Mandarin, Cantonese");

      const kim = await db.getRecordById("row_5");
      expect(kim?.name).toBe("Kim Min-jung");
      expect(kim?.country).toBe("South Korea");
    });
  });

  describe("Timestamp Comparison Logic", () => {
    it("should perform sync when no previous sync exists", async () => {
      // No previous sync time set
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T10:30:00.000Z",
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(MOCK_SHEETS_CSV_SUBSET),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      const lastSync = await db.getLastSyncTime();
      expect(lastSync).toBe("2025-01-15T10:30:00.000Z");
    });

    it("should handle ISO timestamp format correctly", async () => {
      const timestamp1 = "2025-01-15T10:30:00.000Z";
      const timestamp2 = "2025-01-15T10:30:01.000Z"; // 1 second later

      await db.setLastSyncTime(timestamp1);

      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: timestamp2,
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(MOCK_SHEETS_CSV_SUBSET),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      const lastSync = await db.getLastSyncTime();
      expect(lastSync).toBe(timestamp2);
    });
  });
});
