import type { Context } from "hono";
import type { Env, PaginatedResponse, DBRecord } from "../types";
import { DatabaseService } from "../services/database";
import { parsePaginationParams, calculatePaginationMeta } from "../utils/pagination";
import { transformRecords } from "../utils/transform";
import type { JournalistRecord } from "../schema/journalist-schema";

/**
 * GET /records - List all records with filtering, sorting, pagination, and search
 *
 * Query Parameters:
 * - search: Full-text search query (uses FTS5)
 * - page, limit: Pagination
 * - Other parameters: Field-specific filters
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
  const searchQuery = queryParams.search;

  let total: number;
  let records: DBRecord[];

  // Use FTS5 search if search parameter is provided
  if (searchQuery) {
    total = await db.getSearchCount(searchQuery);
    records = await db.searchRecords(searchQuery, limit, offset);
  } else {
    // Use regular filtering
    total = await db.getRecordCount(queryParams);
    records = await db.getRecords(queryParams, limit, offset);
  }

  // Transform records to convert string numbers to actual numbers
  const transformedRecords = transformRecords(records);

  // Calculate pagination metadata
  const pagination = calculatePaginationMeta(page, limit, total);

  return c.json<PaginatedResponse<JournalistRecord>>({
    data: transformedRecords,
    pagination,
  });
}
