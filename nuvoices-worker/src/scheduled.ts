/**
 * Cloudflare Workers Scheduled Event Handler
 *
 * Called by cron trigger (every 2 minutes) to sync Google Sheets data
 * to D1 database cache.
 */

import type { Env } from "./types";
import { syncFromGoogleSheets } from "./services/sync";

/**
 * Scheduled handler for Cloudflare Workers cron triggers
 * Configured in wrangler.toml
 */
export async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log(`Cron trigger fired: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);

  try {
    await syncFromGoogleSheets(env);
    console.log("Scheduled sync completed successfully");
  } catch (error) {
    console.error("Scheduled sync failed:", error);
    // Don't throw - allow cron to retry on next scheduled execution
    // Old data remains intact as designed
  }
}
