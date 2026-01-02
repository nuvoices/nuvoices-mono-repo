import { describe, it, expect } from "vitest";
import {
  parsePaginationParams,
  calculatePaginationMeta,
  PAGINATION_DEFAULTS,
} from "../../src/utils/pagination";

describe("Pagination Utils", () => {
  describe("parsePaginationParams", () => {
    it("should use default values when no params provided", () => {
      const result = parsePaginationParams({});
      expect(result.page).toBe(PAGINATION_DEFAULTS.PAGE);
      expect(result.limit).toBe(PAGINATION_DEFAULTS.LIMIT);
      expect(result.offset).toBe(0);
    });

    it("should parse valid page and limit", () => {
      const result = parsePaginationParams({ page: 2, limit: 10 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(10); // (page-1) * limit
    });

    it("should enforce minimum page of 1", () => {
      const result = parsePaginationParams({ page: 0 });
      expect(result.page).toBe(1);
    });

    it("should enforce maximum limit", () => {
      const result = parsePaginationParams({ limit: 200 });
      expect(result.limit).toBe(PAGINATION_DEFAULTS.MAX_LIMIT);
    });

    it("should calculate correct offset for page 3", () => {
      const result = parsePaginationParams({ page: 3, limit: 20 });
      expect(result.offset).toBe(40); // (3-1) * 20
    });
  });

  describe("calculatePaginationMeta", () => {
    it("should calculate correct metadata for first page", () => {
      const meta = calculatePaginationMeta(1, 20, 100);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(20);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });

    it("should calculate correct metadata for middle page", () => {
      const meta = calculatePaginationMeta(3, 20, 100);
      expect(meta.page).toBe(3);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(true);
    });

    it("should calculate correct metadata for last page", () => {
      const meta = calculatePaginationMeta(5, 20, 100);
      expect(meta.page).toBe(5);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    it("should handle empty results", () => {
      const meta = calculatePaginationMeta(1, 20, 0);
      expect(meta.total).toBe(0);
      expect(meta.totalPages).toBe(0);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });

    it("should handle partial last page", () => {
      const meta = calculatePaginationMeta(3, 20, 55);
      expect(meta.totalPages).toBe(3); // ceil(55/20)
      expect(meta.hasNext).toBe(false);
    });
  });
});
