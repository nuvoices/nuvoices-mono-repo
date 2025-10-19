import type { Context } from "hono";
import type { Env, DBRecord } from "../types";
import { DatabaseService } from "../services/database";
import { APIError } from "../middleware/error";
import { transformRecord } from "../utils/transform";
import type { JournalistRecord } from "../schema/journalist-schema";

/**
 * GET /record/:id - Get a single record by Airtable ID
 */
export async function getRecordHandler(c: Context<{ Bindings: Env }>) {
  const env = c.env;
  const db = new DatabaseService(env.DB);
  const recordId = c.req.param("id");

  if (!recordId) {
    throw new APIError(400, "Record ID is required", "Bad Request");
  }

  // Check if database is initialized
  const isInitialized = await db.isInitialized();

  if (!isInitialized) {
    // Database is empty, return empty array as per requirements
    throw new APIError(404, `Record not found: ${recordId}`, "Not Found");
  }

  // Get record from database
  const record = await db.getRecordByAirtableId(recordId);

  if (!record) {
    throw new APIError(404, `Record not found: ${recordId}`, "Not Found");
  }

  // Transform record to convert string numbers to actual numbers
  const transformedRecord = transformRecord(record);

  return c.json<JournalistRecord>(transformedRecord);
}
