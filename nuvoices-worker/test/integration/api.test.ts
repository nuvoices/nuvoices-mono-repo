import { describe, it, expect, beforeAll } from "vitest";
import { env, SELF } from "cloudflare:test";
import type { Env } from "../../src/types";
import { DatabaseService } from "../../src/services/database";

describe("API Integration Tests", () => {
  let db: DatabaseService;

  beforeAll(() => {
    db = new DatabaseService(env.DB);
  });

  describe("GET /", () => {
    it("should return health check", async () => {
      const response = await SELF.fetch("http://localhost/");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("service");
      expect(data).toHaveProperty("status", "healthy");
    });
  });

  describe("GET /records", () => {
    it("should return empty array when database is empty", async () => {
      const response = await SELF.fetch("http://localhost/records");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data).toEqual([]);
      expect(data).toHaveProperty("pagination");
    });

    it("should support pagination parameters", async () => {
      const response = await SELF.fetch("http://localhost/records?page=2&limit=10");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
    });
  });

  describe("GET /record/:id", () => {
    it("should return 404 for non-existent record", async () => {
      const response = await SELF.fetch("http://localhost/record/nonexistent");
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.status).toBe(404);
    });
  });

  describe("POST /airtable", () => {
    it("should return 400 for invalid JSON", async () => {
      const response = await SELF.fetch("http://localhost/airtable", {
        method: "POST",
        body: "invalid json",
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for base ID mismatch", async () => {
      const response = await SELF.fetch("http://localhost/airtable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: { id: "wrong_base_id" },
          webhook: { id: "webhook_id" },
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("Base ID mismatch");
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await SELF.fetch("http://localhost/unknown");
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error", "Not Found");
      expect(data.message).toContain("/unknown");
    });
  });
});
