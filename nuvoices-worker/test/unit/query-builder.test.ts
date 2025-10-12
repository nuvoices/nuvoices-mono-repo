import { describe, it, expect } from "vitest";
import {
  sanitizeColumnName,
  buildWhereClause,
  buildOrderByClause,
  buildSelectQuery,
  buildCountQuery,
  getSQLType,
} from "../../src/utils/query-builder";

describe("Query Builder Utils", () => {
  describe("sanitizeColumnName", () => {
    it("should lowercase column names", () => {
      expect(sanitizeColumnName("Name")).toBe("name");
    });

    it("should replace spaces with underscores", () => {
      expect(sanitizeColumnName("First Name")).toBe("first_name");
    });

    it("should remove special characters", () => {
      expect(sanitizeColumnName("Email@Address")).toBe("emailaddress");
    });

    it("should handle multiple transformations", () => {
      expect(sanitizeColumnName("User's Full Name!")).toBe("users_full_name");
    });
  });

  describe("getSQLType", () => {
    it("should return INTEGER for number types", () => {
      expect(getSQLType("number")).toBe("INTEGER");
      expect(getSQLType("autoNumber")).toBe("INTEGER");
      expect(getSQLType("count")).toBe("INTEGER");
    });

    it("should return REAL for decimal types", () => {
      expect(getSQLType("percent")).toBe("REAL");
      expect(getSQLType("currency")).toBe("REAL");
      expect(getSQLType("duration")).toBe("REAL");
    });

    it("should return TEXT for string types", () => {
      expect(getSQLType("singleLineText")).toBe("TEXT");
      expect(getSQLType("email")).toBe("TEXT");
      expect(getSQLType("url")).toBe("TEXT");
    });
  });

  describe("buildWhereClause", () => {
    it("should return empty WHERE clause for no filters", () => {
      const result = buildWhereClause({});
      expect(result.sql).toBe("");
      expect(result.params).toEqual([]);
    });

    it("should build WHERE clause for exact match", () => {
      const result = buildWhereClause({ name: "John" });
      expect(result.sql).toContain("WHERE");
      expect(result.sql).toContain("name = ?");
      expect(result.params).toEqual(["John"]);
    });

    it("should handle LIKE patterns with wildcard", () => {
      const result = buildWhereClause({ name: "John*" });
      expect(result.sql).toContain("name LIKE ?");
      expect(result.params).toEqual(["John%"]);
    });

    it("should handle greater than operator", () => {
      const result = buildWhereClause({ age: ">18" });
      expect(result.sql).toContain("age > ?");
      expect(result.params).toEqual(["18"]);
    });

    it("should handle greater than or equal operator", () => {
      const result = buildWhereClause({ age: ">=18" });
      expect(result.sql).toContain("age >= ?");
      expect(result.params).toEqual(["18"]);
    });

    it("should handle not equal operator", () => {
      const result = buildWhereClause({ status: "!=active" });
      expect(result.sql).toContain("status != ?");
      expect(result.params).toEqual(["active"]);
    });

    it("should ignore reserved parameters", () => {
      const result = buildWhereClause({ page: 1, limit: 20, sort: "name" });
      expect(result.sql).toBe("");
      expect(result.params).toEqual([]);
    });

    it("should combine multiple filters with AND", () => {
      const result = buildWhereClause({ name: "John", age: ">18" });
      expect(result.sql).toContain("WHERE");
      expect(result.sql).toContain("AND");
      expect(result.params).toEqual(["John", "18"]);
    });
  });

  describe("buildOrderByClause", () => {
    it("should use default sort by created_time DESC", () => {
      const result = buildOrderByClause({});
      expect(result).toBe("ORDER BY created_time DESC");
    });

    it("should build ORDER BY with custom field", () => {
      const result = buildOrderByClause({ sort: "name" });
      expect(result).toBe("ORDER BY name DESC");
    });

    it("should respect ASC order", () => {
      const result = buildOrderByClause({ sort: "name", order: "asc" });
      expect(result).toBe("ORDER BY name ASC");
    });

    it("should default to DESC for invalid order", () => {
      const result = buildOrderByClause({ sort: "name", order: "invalid" as any });
      expect(result).toBe("ORDER BY name DESC");
    });
  });

  describe("buildSelectQuery", () => {
    it("should build complete SELECT query", () => {
      const result = buildSelectQuery({}, 20, 0);
      expect(result.sql).toContain("SELECT * FROM records");
      expect(result.sql).toContain("ORDER BY created_time DESC");
      expect(result.sql).toContain("LIMIT ? OFFSET ?");
      expect(result.params).toEqual([20, 0]);
    });

    it("should include WHERE clause when filters present", () => {
      const result = buildSelectQuery({ name: "John" }, 20, 0);
      expect(result.sql).toContain("WHERE");
      expect(result.sql).toContain("name = ?");
      expect(result.params).toEqual(["John", 20, 0]);
    });

    it("should include custom ORDER BY", () => {
      const result = buildSelectQuery({ sort: "name", order: "asc" }, 10, 20);
      expect(result.sql).toContain("ORDER BY name ASC");
      expect(result.params).toEqual([10, 20]);
    });
  });

  describe("buildCountQuery", () => {
    it("should build COUNT query without filters", () => {
      const result = buildCountQuery({});
      expect(result.sql).toContain("SELECT COUNT(*) as count FROM records");
      expect(result.params).toEqual([]);
    });

    it("should include WHERE clause with filters", () => {
      const result = buildCountQuery({ name: "John" });
      expect(result.sql).toContain("WHERE");
      expect(result.sql).toContain("name = ?");
      expect(result.params).toEqual(["John"]);
    });
  });
});
