import type { PaginationMeta, RecordsQueryParams } from "../types";

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationParams(params: RecordsQueryParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, params.page || PAGINATION_DEFAULTS.PAGE);
  const limit = Math.min(
    Math.max(1, params.limit || PAGINATION_DEFAULTS.LIMIT),
    PAGINATION_DEFAULTS.MAX_LIMIT
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
