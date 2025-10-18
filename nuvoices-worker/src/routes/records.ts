import type { Context } from "hono";
import type { Env, PaginatedResponse, DBRecord } from "../types";
import { DatabaseService } from "../services/database";
import { parsePaginationParams, calculatePaginationMeta } from "../utils/pagination";

/**
 * GET /records - List all records with filtering, sorting, and pagination
 *
 * Note: Data is synced via cron trigger (every 2 minutes).
 * If no data exists, returns empty array.
 */
export async function getRecordsHandler(c: Context<{ Bindings: Env }>) {
  const env = c.env;
  const db = new DatabaseService(env.DB);

  // Check if database has been synced
  const isInitialized = await db.isInitialized();

  if (!isInitialized) {
    // Return empty response if not yet synced
    console.log("Database not yet synced. Waiting for cron trigger...");

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
