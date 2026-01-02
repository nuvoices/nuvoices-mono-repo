import type { Context, Next } from "hono";
import type { ErrorResponse } from "../types";

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public error: string = "API Error"
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Error handling middleware
 * Catches all errors and formats them consistently
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error("Error occurred:", err);

    let status = 500;
    let error = "Internal Server Error";
    let message = "An unexpected error occurred";

    if (err instanceof APIError) {
      status = err.status;
      error = err.error;
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

    const errorResponse: ErrorResponse = {
      error,
      message,
      status,
      timestamp: new Date().toISOString(),
    };

    return c.json(errorResponse, status);
  }
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(c: Context) {
  const errorResponse: ErrorResponse = {
    error: "Not Found",
    message: `Route ${c.req.path} not found`,
    status: 404,
    timestamp: new Date().toISOString(),
  };

  return c.json(errorResponse, 404);
}
