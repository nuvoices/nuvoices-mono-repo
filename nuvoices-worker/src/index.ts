import { Hono } from "hono";
import type { Env } from "./types";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { logger } from "./middleware/logger";
import { getRecordsHandler } from "./routes/records";
import { getRecordHandler } from "./routes/record";
import { webhookHandler } from "./routes/webhook";

/**
 * Main Hono application
 */
const app = new Hono<{ Bindings: Env }>();

/**
 * Middleware
 */
app.use("*", logger);
app.use("*", errorHandler);

/**
 * Health check endpoint
 */
app.get("/", (c) => {
  return c.json({
    service: "Airtable Cache Worker",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */

// GET /records - List all records with filtering, sorting, and pagination
app.get("/records", getRecordsHandler);

// GET /record/:id - Get a single record by Airtable ID
app.get("/record/:id", getRecordHandler);

// POST /airtable - Webhook handler for Airtable updates
app.post("/airtable", webhookHandler);

/**
 * 404 handler
 */
app.notFound(notFoundHandler);

/**
 * Export the app as default for Cloudflare Workers
 */
export default app;
