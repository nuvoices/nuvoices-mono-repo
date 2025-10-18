import { Hono } from "hono";
import type { Env } from "./types";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { logger } from "./middleware/logger";
import { getRecordsHandler } from "./routes/records";
import { getRecordHandler } from "./routes/record";

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
    service: "Google Sheets Cache Worker",
    status: "healthy",
    version: "2.0.0",
    description: "Cron-based sync from Google Sheets to D1 Database",
    endpoints: {
      records: "GET /records - List all records with filtering and pagination",
      record: "GET /record/:id - Get a single record by ID",
    },
    sync: {
      strategy: "cron-pull",
      frequency: "every 2 minutes",
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */

// GET /records - List all records with filtering, sorting, and pagination
app.get("/records", getRecordsHandler);

// GET /record/:id - Get a single record by ID
app.get("/record/:id", getRecordHandler);

/**
 * 404 handler
 */
app.notFound(notFoundHandler);

/**
 * Export the Hono app for HTTP requests and scheduled events
 */
export default app;

/**
 * Export scheduled handler for cron triggers
 */
export { scheduled } from "./scheduled";
