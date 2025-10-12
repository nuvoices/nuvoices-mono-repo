import type { Context } from "hono";
import type { Env, PaginatedResponse, DBRecord } from "../types";
import { DatabaseService } from "../services/database";
import { AirtableService } from "../services/airtable";
import { parsePaginationParams, calculatePaginationMeta } from "../utils/pagination";
import { APIError } from "../middleware/error";

/**
 * GET /records - List all records with filtering, sorting, and pagination
 */
export async function getRecordsHandler(c: Context<{ Bindings: Env }>) {
  const env = c.env;
  const db = new DatabaseService(env.DB);
  const airtable = new AirtableService(env);

  // Check if database is initialized
  const isInitialized = await db.isInitialized();

  if (!isInitialized) {
    // Lazy load: Fetch from Airtable and populate database
    console.log("Database not initialized. Fetching from Airtable...");

    try {
      const result = await db.initializeFromAirtable(airtable);
      console.log(`Initialized database with ${result.recordCount} records`);
    } catch (error) {
      console.error("Failed to initialize database from Airtable:", error);

      // If no records available, return empty array
      if (error instanceof Error && error.message.includes("No records available")) {
        return c.json<PaginatedResponse<DBRecord>>({
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }

      throw new APIError(
        500,
        error instanceof Error ? error.message : "Failed to fetch from Airtable",
        "Initialization Error"
      );
    }
  }

  // Parse query parameters
  const queryParams = c.req.query();
  const { page, limit, offset } = parsePaginationParams(queryParams);

  // Get total count with filters
  const total = await db.getRecordCount(queryParams);

  // Get records with filters and pagination
  const records = await db.getRecords(queryParams, limit, offset);

  // Calculate pagination metadata
  const pagination = calculatePaginationMeta(page, limit, total);

  return c.json<PaginatedResponse<DBRecord>>({
    data: records,
    pagination,
  });
}
