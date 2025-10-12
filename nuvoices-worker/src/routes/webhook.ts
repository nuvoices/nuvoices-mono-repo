import type { Context } from "hono";
import type { Env, AirtableWebhookPayload, SuccessResponse } from "../types";
import { DatabaseService } from "../services/database";
import { AirtableService } from "../services/airtable";
import { APIError } from "../middleware/error";

/**
 * POST /airtable - Handle Airtable webhook for incremental updates
 */
export async function webhookHandler(c: Context<{ Bindings: Env }>) {
  const env = c.env;
  const db = new DatabaseService(env.DB);
  const airtable = new AirtableService(env);

  // Parse webhook payload
  let payload: AirtableWebhookPayload;
  try {
    payload = await c.req.json<AirtableWebhookPayload>();
  } catch (error) {
    throw new APIError(400, "Invalid JSON payload", "Bad Request");
  }

  // Verify base ID matches
  if (payload.base.id !== env.BASE_ID) {
    throw new APIError(
      400,
      `Base ID mismatch. Expected: ${env.BASE_ID}, Got: ${payload.base.id}`,
      "Bad Request"
    );
  }

  console.log(`Received webhook at ${payload.timestamp}`);

  // Check if database/table exists
  const tableExists = await db.tableExists();

  if (!tableExists) {
    // If table doesn't exist, we need to initialize it first
    console.log("Table doesn't exist. Initializing from Airtable...");
    try {
      const result = await db.initializeFromAirtable(airtable);
      console.log(`Database initialized via webhook with ${result.recordCount} records`);
      return c.json<SuccessResponse>({
        success: true,
        message: `Database initialized with ${result.recordCount} records`,
      });
    } catch (error) {
      throw new APIError(
        500,
        error instanceof Error ? error.message : "Failed to initialize database",
        "Initialization Error"
      );
    }
  }

  // Get schema from stored metadata (much more efficient than fetching records)
  let schema = await db.getStoredSchema();

  if (!schema) {
    // Fallback: infer from webhook payload records if schema not found
    console.log("Schema not found in metadata, inferring from webhook payload");
    const recordsToInfer = [
      ...Object.values(payload.createdRecordsById || {}),
      ...Object.values(payload.changedRecordsById || {}).map(c => c.current),
    ].filter(Boolean);

    if (recordsToInfer.length === 0) {
      return c.json<SuccessResponse>({
        success: true,
        message: "No records to process and no schema available",
      });
    }

    const inferredSchema = await airtable.inferSchemaFromRecords(recordsToInfer);
    schema = inferredSchema.fields;

    // Store for future use
    await db.initializeSchema(schema);
  }

  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  try {
    // Handle created records
    if (payload.createdRecordsById) {
      const createdRecords = Object.values(payload.createdRecordsById);
      for (const record of createdRecords) {
        await db.insertRecord(record, schema.fields);
        createdCount++;
      }
      console.log(`Created ${createdCount} records`);
    }

    // Handle updated records
    if (payload.changedRecordsById) {
      for (const change of Object.values(payload.changedRecordsById)) {
        if (change.current) {
          await db.updateRecord(change.current.id, change.current, schema.fields);
          updatedCount++;
        }
      }
      console.log(`Updated ${updatedCount} records`);
    }

    // Handle deleted records
    if (payload.destroyedRecordIds && payload.destroyedRecordIds.length > 0) {
      await db.deleteRecords(payload.destroyedRecordIds);
      deletedCount = payload.destroyedRecordIds.length;
      console.log(`Deleted ${deletedCount} records`);
    }

    return c.json<SuccessResponse>({
      success: true,
      message: `Processed webhook: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted`,
      data: {
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
      },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    throw new APIError(
      500,
      error instanceof Error ? error.message : "Failed to process webhook",
      "Webhook Processing Error"
    );
  }
}
