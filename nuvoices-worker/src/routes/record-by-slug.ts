import { Hono } from "hono";
import type { Env } from "../types";
import { DatabaseService } from "../services/database";
import { APIError } from "../middleware/error";

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /record/by-slug/:slug
 * Get a single record by its URL slug
 */
app.get("/record/by-slug/:slug", async (c) => {
  const slug = c.req.param("slug");

  if (!slug) {
    throw new APIError(400, "Slug is required", "Bad Request");
  }

  try {
    const db = new DatabaseService(c.env.DB);
    const record = await db.getRecordBySlug(slug);

    if (!record) {
      throw new APIError(404, `Record not found: ${slug}`, "Not Found");
    }

    return c.json(record);
  } catch (error) {
    // Re-throw APIErrors
    if (error instanceof APIError) {
      throw error;
    }

    console.error("Error fetching record by slug:", error);
    throw new APIError(500, "Failed to fetch record", "Internal Server Error");
  }
});

export default app;
