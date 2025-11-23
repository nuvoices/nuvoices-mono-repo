/**
 * Google Sheets Sync Service
 *
 * Orchestrates syncing data from Google Sheets to D1 database
 * via Cloudflare Cron Triggers.
 */

import type { Env } from "../types";
import { DatabaseService } from "./database";
import { parseCSV, csvToRecords } from "../utils/csv-parser";
import { validateCSVHeaders, createSchemaFromHeaders } from "../schema/journalist-schema";
import { generateUniqueSlugs } from "../utils/slug";

interface TimestampResponse {
  spreadsheetId: string;
  lastUpdated: string;
}

/**
 * Main sync function called by cron trigger
 */
export async function syncFromGoogleSheets(env: Env): Promise<void> {
  console.log("Starting Google Sheets sync...");

  const db = new DatabaseService(env.DB);

  try {
    // Step 0: Validate required environment variables
    if (!env.CSV_URL) {
      throw new Error("CSV_URL environment variable is not set. Please configure it in Cloudflare Dashboard.");
    }
    console.log(`CSV_URL configured: ${env.CSV_URL.substring(0, 50)}...`);

    // Step 1: Fetch CSV data from Apps Script (moved earlier to get headers)
    console.log("Fetching CSV data...");
    const csvData = await fetchCSVData(env.CSV_URL);

    // Step 2: Parse CSV to get headers
    console.log("Parsing CSV...");
    const { headers, rows } = parseCSV(csvData);
    console.log(`Parsed ${headers.length} columns, ${rows.length} rows`);

    // Step 3: Validate CSV headers
    validateCSVHeaders(headers);
    console.log("CSV headers validated");

    // Step 4: Create dynamic schema from headers (all TEXT type)
    const schema = createSchemaFromHeaders(headers);
    console.log(`Created dynamic schema with ${schema.length} fields (all TEXT)`);

    // Step 5: Fetch timestamp from Apps Script (optional)
    let shouldSync = true;
    if (env.TIMESTAMP_URL) {
      try {
        const timestamp = await fetchTimestamp(env.TIMESTAMP_URL);
        console.log(`Google Sheets lastUpdated: ${timestamp.lastUpdated}`);

        // Step 6: Get last sync time from database
        const lastSyncTime = await db.getLastSyncTime();
        console.log(`Last sync time: ${lastSyncTime || 'never'}`);

        // Step 7: Compare timestamps - skip if unchanged
        if (lastSyncTime === timestamp.lastUpdated) {
          console.log("No changes detected, skipping sync");
          return;
        }
      } catch (error) {
        console.warn("Failed to fetch timestamp, proceeding with sync anyway:", error);
        // Continue with sync even if timestamp check fails
      }
    } else {
      console.log("TIMESTAMP_URL not configured, proceeding with sync");
    }

    // Step 8: Convert to records
    const records = csvToRecords(headers, rows);
    console.log(`Converted to ${records.length} records`);

    // Step 8.5: Generate unique slugs from names
    console.log("Generating unique slugs...");
    const names = records.map(r => r['Name'] || r['name'] || '');
    const slugs = generateUniqueSlugs(names);

    // Add slug to each record
    const recordsWithSlugs = records.map((record, index) => ({
      ...record,
      slug: slugs[index]
    }));
    console.log(`Generated ${slugs.length} unique slugs`);

    // Add 'slug' to schema
    const schemaWithSlug = [
      ...schema,
      { name: 'slug', sqlType: 'TEXT' as const, required: false }
    ];

    // Step 9: Replace all records atomically (uses dynamic schema)
    console.log("Replacing table...");
    await db.replaceAllRecords(recordsWithSlugs, schemaWithSlug);

    // Step 10: Update last sync time (if timestamp was fetched)
    if (env.TIMESTAMP_URL) {
      try {
        const timestamp = await fetchTimestamp(env.TIMESTAMP_URL);
        await db.setLastSyncTime(timestamp.lastUpdated);
      } catch (error) {
        console.warn("Could not update last sync time:", error);
      }
    }

    console.log(`✅ Sync complete: ${records.length} records synced`);

  } catch (error) {
    console.error("❌ Sync failed:", error);
    console.error("Keeping old data intact");
    // Error handling: Keep old data, wait for next cron
    throw error;
  }
}

/**
 * Fetch timestamp from Apps Script
 */
async function fetchTimestamp(url: string): Promise<TimestampResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch timestamp: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;

  if (!data.lastUpdated) {
    throw new Error("Invalid timestamp response: missing lastUpdated field");
  }

  return data as TimestampResponse;
}

/**
 * Fetch CSV data from Apps Script
 */
async function fetchCSVData(url: string): Promise<string> {
  if (!url) {
    throw new Error("CSV_URL is undefined. Cannot fetch CSV data.");
  }

  console.log(`Fetching from URL: ${url.substring(0, 100)}...`);

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Network error fetching CSV from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV from ${url}: HTTP ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  console.log(`Received CSV data: ${text.length} characters`);

  if (!text || text.trim().length === 0) {
    throw new Error("CSV data is empty");
  }

  return text;
}
