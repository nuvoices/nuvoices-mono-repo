/**
 * Google Sheets Sync Service
 *
 * Orchestrates syncing data from Google Sheets to D1 database
 * via Cloudflare Cron Triggers.
 */

import type { Env } from "../types";
import { DatabaseService } from "./database";
import { parseCSV, csvToRecords } from "../utils/csv-parser";
import { validateCSVHeaders } from "../schema/journalist-schema";

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
    // Step 1: Fetch timestamp from Apps Script
    const timestamp = await fetchTimestamp(env.TIMESTAMP_URL);
    console.log(`Google Sheets lastUpdated: ${timestamp.lastUpdated}`);

    // Step 2: Get last sync time from database
    const lastSyncTime = await db.getLastSyncTime();
    console.log(`Last sync time: ${lastSyncTime || 'never'}`);

    // Step 3: Compare timestamps - skip if unchanged
    if (lastSyncTime === timestamp.lastUpdated) {
      console.log("No changes detected, skipping sync");
      return;
    }

    // Step 4: Fetch CSV data from Apps Script
    console.log("Fetching CSV data...");
    const csvData = await fetchCSVData(env.CSV_URL);

    // Step 5: Parse CSV
    console.log("Parsing CSV...");
    const { headers, rows } = parseCSV(csvData);
    console.log(`Parsed ${headers.length} columns, ${rows.length} rows`);

    // Step 6: Validate CSV headers against expected schema
    validateCSVHeaders(headers);
    console.log("CSV headers validated against schema");

    // Step 7: Convert to records
    const records = csvToRecords(headers, rows);
    console.log(`Converted to ${records.length} records`);

    // Step 8: Replace all records atomically (uses fixed schema internally)
    console.log("Replacing table...");
    await db.replaceAllRecords(records);

    // Step 9: Update last sync time
    await db.setLastSyncTime(timestamp.lastUpdated);

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

  const data = await response.json();

  if (!data.lastUpdated) {
    throw new Error("Invalid timestamp response: missing lastUpdated field");
  }

  return data as TimestampResponse;
}

/**
 * Fetch CSV data from Apps Script
 */
async function fetchCSVData(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("CSV data is empty");
  }

  return text;
}
