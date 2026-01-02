import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { logger } from "./middleware/logger";
import { getRecordsHandler } from "./routes/records";
import { getRecordHandler } from "./routes/record";
import recordBySlugRoute from "./routes/record-by-slug";
import { syncFromGoogleSheets } from "./services/sync";

/**
 * Main Hono application
 */
const app = new Hono<{ Bindings: Env }>();

/**
 * Middleware
 */
// CORS - Allow requests from any origin
app.use("*", cors({
  origin: "*",  // Allow all origins (can be restricted later if needed)
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

app.use("*", logger);

/**
 * Error handler
 */
app.onError((err, c) => {
  console.error("Error occurred:", err);

  let status = 500;
  let error = "Internal Server Error";
  let message = "An unexpected error occurred";

  if (err instanceof Error && err.name === "APIError" && 'status' in err && 'error' in err) {
    // APIError instance
    status = (err as any).status;
    error = (err as any).error;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;

    // Check for specific error types
    if (message.includes("not found")) {
      status = 404;
      error = "Not Found";
    } else if (message.includes("unauthorized") || message.includes("authentication")) {
      status = 401;
      error = "Unauthorized";
    } else if (message.includes("forbidden")) {
      status = 403;
      error = "Forbidden";
    } else if (message.includes("bad request") || message.includes("invalid")) {
      status = 400;
      error = "Bad Request";
    }
  }

  return c.json({
    error,
    message,
    status,
    timestamp: new Date().toISOString(),
  }, status);
});

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
      records: "GET /records - List all records with filtering, search, and pagination",
      record: "GET /record/:id - Get a single record by ID",
      recordBySlug: "GET /record/by-slug/:slug - Get a single record by URL slug",
      sync: "POST /sync - Manually trigger sync from Google Sheets (dev/testing)",
    },
    features: {
      search: "Full-text search with partial matching - Use ?search=query parameter. Automatically adds prefix matching (e.g., 'man' matches 'mandarin', 'manager')",
      filtering: "Field-specific filters - Use ?field=value parameters",
      pagination: "Use ?page=N&limit=M parameters",
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

// Mount the record-by-slug route
app.route("/", recordBySlugRoute);

/**
 * Manual sync trigger endpoint (useful for development/testing)
 * POST /sync - Manually trigger a sync from Google Sheets
 */
app.post("/sync", async (c) => {
  try {
    console.log("Manual sync triggered via POST /sync");
    await syncFromGoogleSheets(c.env);
    return c.json({
      success: true,
      message: "Sync completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Manual sync failed:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

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
