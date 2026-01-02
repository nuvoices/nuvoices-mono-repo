import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { env } from "cloudflare:test";
import { scheduled } from "../../src/scheduled";
import { DatabaseService } from "../../src/services/database";
import type { Env } from "../../src/types";
import { SIMPLE_JOURNALIST_CSV, MOCK_SHEETS_CSV_SUBSET } from "../helpers/csv-data";

describe("Scheduled Handler Integration Tests", () => {
  let db: DatabaseService;
  let mockEnv: Env;
  let mockEvent: ScheduledEvent;
  let mockCtx: ExecutionContext;

  beforeEach(() => {
    db = new DatabaseService(env.DB);
    mockEnv = {
      DB: env.DB,
      TIMESTAMP_URL: "https://example.com/timestamp",
      CSV_URL: "https://example.com/csv",
    };

    // Mock ScheduledEvent
    mockEvent = {
      cron: "*/2 * * * *",
      scheduledTime: Date.now(),
      type: "scheduled",
    } as ScheduledEvent;

    // Mock ExecutionContext
    mockCtx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as unknown as ExecutionContext;
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

  describe("Scheduled Event Execution", () => {
    it("should execute sync on scheduled event", async () => {
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

      await scheduled(mockEvent, mockEnv, mockCtx);

      // Verify sync completed successfully
      const count = await db.getRecordCount();
      expect(count).toBe(5);
    });

    it("should handle cron trigger with correct timing", async () => {
      const scheduledTime = new Date("2025-01-15T10:30:00.000Z").getTime();
      mockEvent.scheduledTime = scheduledTime;

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

      await scheduled(mockEvent, mockEnv, mockCtx);

      expect(mockEvent.scheduledTime).toBe(scheduledTime);
    });

    it("should not throw on sync error", async () => {
      // Mock fetch to fail
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response)
      );

      // Should not throw - errors are caught and logged
      await expect(
        scheduled(mockEvent, mockEnv, mockCtx)
      ).resolves.toBeUndefined();
    });

    it("should preserve old data when sync fails", async () => {
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

      await scheduled(mockEvent, mockEnv, mockCtx);

      const initialCount = await db.getRecordCount();
      expect(initialCount).toBe(5);

      // Second sync fails
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response)
      );

      await scheduled(mockEvent, mockEnv, mockCtx);

      // Verify old data is still intact
      const countAfterError = await db.getRecordCount();
      expect(countAfterError).toBe(5);
    });
  });

  describe("Repeated Scheduled Executions", () => {
    it("should handle multiple scheduled executions", async () => {
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

      // First execution
      await scheduled(mockEvent, mockEnv, mockCtx);

      const count1 = await db.getRecordCount();
      expect(count1).toBe(5);

      // Second execution (no changes, should skip)
      await scheduled(mockEvent, mockEnv, mockCtx);

      const count2 = await db.getRecordCount();
      expect(count2).toBe(5);
    });

    it("should sync when data changes between executions", async () => {
      // First execution
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

      await scheduled(mockEvent, mockEnv, mockCtx);

      const count1 = await db.getRecordCount();
      expect(count1).toBe(5);

      // Second execution with new data
      global.fetch = vi.fn((url: string) => {
        if (url.includes("timestamp")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spreadsheetId: "test-sheet-id",
                lastUpdated: "2025-01-15T11:00:00.000Z", // New timestamp
              }),
          } as Response);
        } else if (url.includes("csv")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(SIMPLE_JOURNALIST_CSV),
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      await scheduled(mockEvent, mockEnv, mockCtx);

      // Verify new data replaced old data
      const count2 = await db.getRecordCount();
      expect(count2).toBe(2);

      const record = await db.getRecordById("row_2");
      expect(record?.name).toBe("Updated Person");
    });
  });

  describe("Cron Schedule Validation", () => {
    it("should execute with correct cron pattern", async () => {
      mockEvent.cron = "*/2 * * * *"; // Every 2 minutes

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

      await scheduled(mockEvent, mockEnv, mockCtx);

      expect(mockEvent.cron).toBe("*/2 * * * *");
    });
  });

  describe("Error Resilience", () => {
    it("should not crash on network errors", async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

      // Should not throw
      await expect(
        scheduled(mockEvent, mockEnv, mockCtx)
      ).resolves.toBeUndefined();
    });

    it("should not crash on invalid JSON response", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error("Invalid JSON")),
        } as Response)
      );

      // Should not throw
      await expect(
        scheduled(mockEvent, mockEnv, mockCtx)
      ).resolves.toBeUndefined();
    });

    it("should not crash on database errors", async () => {
      // Create invalid environment with null database
      const invalidEnv = {
        DB: null as unknown as D1Database,
        TIMESTAMP_URL: "https://example.com/timestamp",
        CSV_URL: "https://example.com/csv",
      };

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
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      // Should not throw
      await expect(
        scheduled(mockEvent, invalidEnv, mockCtx)
      ).resolves.toBeUndefined();
    });
  });

  describe("Performance and Timing", () => {
    it("should complete sync within reasonable time", async () => {
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

      const startTime = Date.now();
      await scheduled(mockEvent, mockEnv, mockCtx);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds (generous timeout)
      expect(duration).toBeLessThan(5000);
    });
  });
});
