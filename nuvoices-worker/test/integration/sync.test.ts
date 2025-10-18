import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { env } from "cloudflare:test";
import { syncFromGoogleSheets } from "../../src/services/sync";
import { DatabaseService } from "../../src/services/database";
import type { Env } from "../../src/types";

// Mock CSV data (first 5 records from mockSheetsCSV.txt for testing)
const mockCSVData = `Name,Email,Phone,Country,City,Languages,Specializations,Years_Experience,Outlet,Time_Zone,LinkedIn_Profile,Avatar,Daily_Rate_USD,Available_For_Live,Last_Updated
Sarah Chen,s.chen.reporter@email.com,+86-138-1234-5678,China,Beijing,"English, Mandarin, Cantonese","Politics, Trade, Technology",12,Freelance,GMT+8,linkedin.com/in/sarahchen,https://images.example.com/avatars/schen-profile-400x400.jpg,450,Yes,2025-01-15
Raj Patel,raj.patel.news@email.com,+91-98765-43210,India,Mumbai,"English, Hindi, Marathi","Business, Bollywood, Finance",8,Times of India,GMT+5:30,linkedin.com/in/rajpatel,https://media.example.org/reporters/raj_patel_headshot.png,350,Yes,2025-01-10
Yuki Tanaka,y.tanaka@email.jp,+81-90-1234-5678,Japan,Tokyo,"Japanese, English","Technology, Gaming, Pop Culture",10,NHK World,GMT+9,linkedin.com/in/yukitanaka,https://cdn.newsagency.com/photos/ytanaka-2025.jpg,500,No,2025-01-12
Kim Min-jung,kmj.reporter@email.kr,+82-10-9876-5432,South Korea,Seoul,"Korean, English, Mandarin","K-pop, Technology, Politics",6,Freelance,GMT+9,linkedin.com/in/kimminjung,https://assets.journalist.net/profiles/kim-minjung-sq.jpg,400,Yes,2025-01-08
Ahmad Hassan,a.hassan.jour@email.com,+62-812-3456-7890,Indonesia,Jakarta,"Indonesian, English, Arabic","Politics, Islam, Environment",15,Jakarta Post,GMT+7,linkedin.com/in/ahmadhassan,https://storage.media.com/avatars/ahmad_hassan_300.jpg,325,Yes,2025-01-14`;

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
            text: () => Promise.resolve(mockCSVData),
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
            text: () => Promise.resolve(mockCSVData),
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
            text: () => Promise.resolve(mockCSVData),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      const initialCount = await db.getRecordCount();
      expect(initialCount).toBe(5);

      // Second sync with different data
      const newCSVData = `Name,Email
New Person,new@example.com`;

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
            text: () => Promise.resolve(newCSVData),
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
            text: () => Promise.resolve(mockCSVData),
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

  describe("Schema Inference and Data Types", () => {
    it("should correctly infer schema from CSV data", async () => {
      const csvWithTypes = `Name,Age,Rating,Active
John Doe,30,4.5,Yes
Jane Smith,25,4.8,No`;

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
            text: () => Promise.resolve(csvWithTypes),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await syncFromGoogleSheets(mockEnv);

      // Verify schema was inferred correctly
      const schema = await db.getStoredSchema();
      expect(schema).toBeDefined();

      // Check record to verify types
      const record = await db.getRecordById("row_2");
      expect(record?.name).toBe("John Doe");
      expect(record?.age).toBe(30); // INTEGER
      expect(record?.rating).toBe(4.5); // REAL
      expect(record?.active).toBe("Yes"); // TEXT
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
            text: () => Promise.resolve(mockCSVData),
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
            text: () => Promise.resolve(mockCSVData),
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
            text: () => Promise.resolve(mockCSVData),
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
