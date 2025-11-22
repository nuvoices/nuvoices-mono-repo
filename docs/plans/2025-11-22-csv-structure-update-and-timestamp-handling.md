# CSV Structure Update and TIMESTAMP_URL Handling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update CSV parser to skip first 2 rows, extract headers from row 3, force all column types to TEXT, and gracefully handle missing TIMESTAMP_URL environment variable.

**Architecture:** Modify CSV parsing logic to handle new Google Sheets structure with 2 header rows to skip. Update sync service to make TIMESTAMP_URL optional, falling back to always-sync behavior when not present. Update schema to use TEXT for all fields.

**Tech Stack:** TypeScript, Cloudflare Workers, Hono, D1 Database, Vitest

---

## Task 1: Update CSV Parser to Skip First Two Rows

**Files:**
- Modify: `nuvoices-worker/src/utils/csv-parser.ts:22-33`
- Test: `nuvoices-worker/tests/csv-parser.test.ts` (create if doesn't exist)

**Step 1: Write failing test for new CSV structure**

Create `nuvoices-worker/tests/csv-parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../src/utils/csv-parser';

describe('parseCSV', () => {
  it('should skip first 2 rows and use row 3 as headers', () => {
    const csvText = `Row 1 - Skip this line
Row 2 - Skip this line too
Name,Email,Country
John Doe,john@example.com,USA
Jane Smith,jane@example.com,Canada`;

    const result = parseCSV(csvText);

    expect(result.headers).toEqual(['Name', 'Email', 'Country']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['John Doe', 'john@example.com', 'USA']);
    expect(result.rows[1]).toEqual(['Jane Smith', 'jane@example.com', 'Canada']);
  });

  it('should handle empty CSV after skipping rows', () => {
    const csvText = `Skip row 1
Skip row 2
Headers Only`;

    const result = parseCSV(csvText);

    expect(result.headers).toEqual(['Headers Only']);
    expect(result.rows).toHaveLength(0);
  });

  it('should throw error if less than 3 rows', () => {
    const csvText = `Only one row
Only two rows`;

    expect(() => parseCSV(csvText)).toThrow('CSV must have at least 3 rows');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd nuvoices-worker && pnpm test csv-parser`
Expected: FAIL - "Expected headers to skip first 2 rows"

**Step 3: Update parseCSV function to skip first 2 rows**

Modify `nuvoices-worker/src/utils/csv-parser.ts`:

```typescript
export function parseCSV(csvText: string): ParsedCSV {
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length < 3) {
    throw new Error("CSV must have at least 3 rows (2 rows to skip + 1 header row)");
  }

  // Skip first 2 rows, use row 3 as headers
  const headers = parseCSVLine(lines[2]);
  const rows = lines.slice(3).map(line => parseCSVLine(line));

  return { headers, rows };
}
```

**Step 4: Run test to verify it passes**

Run: `cd nuvoices-worker && pnpm test csv-parser`
Expected: PASS

**Step 5: Commit**

```bash
git add nuvoices-worker/tests/csv-parser.test.ts nuvoices-worker/src/utils/csv-parser.ts
git commit -m "feat: update CSV parser to skip first 2 rows and use row 3 as headers"
```

---

## Task 2: Update Schema to Use TEXT for All Columns

**Files:**
- Modify: `nuvoices-worker/src/schema/journalist-schema.ts:22-38`
- Modify: `nuvoices-worker/src/utils/csv-parser.ts:64-116`

**Step 1: Update JOURNALIST_SCHEMA to remove hardcoded fields**

Since column names are now dynamic and extracted from row 3, we need to remove the fixed schema approach and make it dynamic while ensuring all types are TEXT.

Modify `nuvoices-worker/src/schema/journalist-schema.ts`:

```typescript
/**
 * Strict schema definition for journalist/expert records
 *
 * This schema is now dynamically generated from CSV headers.
 * All column types are TEXT to preserve data integrity.
 */

export interface SchemaField {
  name: string;           // CSV column name (as it appears in Google Sheets)
  sqlType: 'TEXT' | 'INTEGER' | 'REAL';  // SQL column type
  required: boolean;      // Whether this field must be present
}

/**
 * Create schema from CSV headers with all fields as TEXT
 * This ensures data integrity and avoids type conversion issues
 */
export function createSchemaFromHeaders(headers: string[]): SchemaField[] {
  return headers.map(header => ({
    name: header,
    sqlType: 'TEXT' as const,
    required: false, // No required fields since structure is dynamic
  }));
}

/**
 * Legacy JOURNALIST_SCHEMA for backwards compatibility
 * Will be replaced by dynamic schema from CSV headers
 * @deprecated Use createSchemaFromHeaders instead
 */
export const JOURNALIST_SCHEMA: SchemaField[] = [
  { name: 'Name', sqlType: 'TEXT', required: false },
  { name: 'Email', sqlType: 'TEXT', required: false },
  { name: 'Phone', sqlType: 'TEXT', required: false },
  { name: 'Country', sqlType: 'TEXT', required: false },
  { name: 'City', sqlType: 'TEXT', required: false },
  { name: 'Languages', sqlType: 'TEXT', required: false },
  { name: 'Specializations', sqlType: 'TEXT', required: false },
  { name: 'Years_Experience', sqlType: 'TEXT', required: false },
  { name: 'Outlet', sqlType: 'TEXT', required: false },
  { name: 'Time_Zone', sqlType: 'TEXT', required: false },
  { name: 'LinkedIn_Profile', sqlType: 'TEXT', required: false },
  { name: 'Avatar', sqlType: 'TEXT', required: false },
  { name: 'Daily_Rate_USD', sqlType: 'TEXT', required: false },
  { name: 'Available_For_Live', sqlType: 'TEXT', required: false },
  { name: 'Last_Updated', sqlType: 'TEXT', required: false },
];

/**
 * Helper function to get SQL column name from CSV column name
 * Converts "Years Experience" to "years_experience"
 */
export function toSqlColumnName(csvName: string): string {
  return csvName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Validate that CSV headers are present and non-empty
 * Since all fields are optional, we just check for non-empty headers
 */
export function validateCSVHeaders(headers: string[]): void {
  if (headers.length === 0) {
    throw new Error('CSV headers cannot be empty');
  }

  const emptyHeaders = headers.filter(h => !h || h.trim() === '');
  if (emptyHeaders.length > 0) {
    throw new Error('CSV contains empty header names');
  }
}

/**
 * Get schema field by CSV column name
 */
export function getSchemaField(csvName: string, schema: SchemaField[]): SchemaField | undefined {
  return schema.find(field => field.name === csvName);
}
```

**Step 2: Update CSV parser to remove type inference**

Modify `nuvoices-worker/src/utils/csv-parser.ts` - remove `inferSchemaFromCSV` and `inferColumnType` functions since all types are now TEXT:

```typescript
/**
 * CSV Parser Utility
 *
 * Parses CSV text with support for quoted fields containing commas.
 * All fields are treated as TEXT type.
 */

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export interface FieldSchema {
  name: string;
  type: "TEXT" | "INTEGER" | "REAL";
}

/**
 * Parse CSV text to structured data
 * Handles quoted fields with commas: "English, Mandarin, Cantonese"
 * Skips first 2 rows and uses row 3 as headers
 */
export function parseCSV(csvText: string): ParsedCSV {
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length < 3) {
    throw new Error("CSV must have at least 3 rows (2 rows to skip + 1 header row)");
  }

  // Skip first 2 rows, use row 3 as headers
  const headers = parseCSVLine(lines[2]);
  const rows = lines.slice(3).map(line => parseCSVLine(line));

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Convert CSV rows to record objects
 */
export function csvToRecords(headers: string[], rows: string[][]): Array<Record<string, string>> {
  return rows.map((row, index) => {
    const record: Record<string, string> = {
      id: `row_${index + 4}` // Rows 1-2 skipped, row 3 is headers, so data starts at row 4
    };

    headers.forEach((header, colIndex) => {
      const value = row[colIndex];
      if (value && value.trim() !== '') {
        record[header] = value;
      }
    });

    return record;
  });
}
```

**Step 3: Add test for dynamic schema creation**

Add to `nuvoices-worker/tests/csv-parser.test.ts`:

```typescript
import { createSchemaFromHeaders } from '../src/schema/journalist-schema';

describe('createSchemaFromHeaders', () => {
  it('should create TEXT schema from headers', () => {
    const headers = ['Name', 'Email', 'Age', 'Salary'];
    const schema = createSchemaFromHeaders(headers);

    expect(schema).toHaveLength(4);
    expect(schema[0]).toEqual({ name: 'Name', sqlType: 'TEXT', required: false });
    expect(schema[1]).toEqual({ name: 'Email', sqlType: 'TEXT', required: false });
    expect(schema[2]).toEqual({ name: 'Age', sqlType: 'TEXT', required: false });
    expect(schema[3]).toEqual({ name: 'Salary', sqlType: 'TEXT', required: false });
  });
});
```

**Step 4: Run tests to verify they pass**

Run: `cd nuvoices-worker && pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add nuvoices-worker/src/schema/journalist-schema.ts nuvoices-worker/src/utils/csv-parser.ts nuvoices-worker/tests/csv-parser.test.ts
git commit -m "feat: update schema to dynamic TEXT-only fields from CSV headers"
```

---

## Task 3: Update Sync Service to Use Dynamic Schema

**Files:**
- Modify: `nuvoices-worker/src/services/sync.ts:21-73`
- Modify: `nuvoices-worker/src/services/database.ts:210-299`

**Step 1: Update syncFromGoogleSheets to create schema from CSV headers**

Modify `nuvoices-worker/src/services/sync.ts`:

```typescript
import type { Env } from "../types";
import { DatabaseService } from "./database";
import { parseCSV, csvToRecords } from "../utils/csv-parser";
import { validateCSVHeaders, createSchemaFromHeaders } from "../schema/journalist-schema";

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

    // Step 9: Replace all records atomically (uses dynamic schema)
    console.log("Replacing table...");
    await db.replaceAllRecords(records, schema);

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
 * Returns null if TIMESTAMP_URL is not configured
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
```

**Step 2: Update DatabaseService.replaceAllRecords to accept schema parameter**

Modify `nuvoices-worker/src/services/database.ts`:

```typescript
/**
 * Replace all records atomically (for full table sync from Google Sheets)
 * Uses D1 batch for atomic execution - all or nothing
 * Uses provided schema (dynamically created from CSV headers)
 */
async replaceAllRecords(
  records: Array<Record<string, string>>,
  schema: SchemaField[]
): Promise<void> {
  if (records.length === 0) {
    throw new Error("Cannot replace with empty record set");
  }

  const statements: D1PreparedStatement[] = [];

  // Step 1: Drop existing tables
  statements.push(this.db.prepare("DROP TABLE IF EXISTS records_fts"));
  statements.push(this.db.prepare("DROP TABLE IF EXISTS records"));

  // Step 2: Create table with new schema
  const createTableSQL = buildCreateTableSQL(schema);
  statements.push(this.db.prepare(createTableSQL));

  // Step 3: Create indexes
  const indexStatements = buildCreateIndexSQL();
  for (const indexSQL of indexStatements) {
    statements.push(this.db.prepare(indexSQL));
  }

  // Step 4: Create FTS5 virtual table
  const createFTS5SQL = buildCreateFTS5TableSQL();
  statements.push(this.db.prepare(createFTS5SQL));

  // Step 5: Insert all records (batched in chunks due to D1 limits)
  const BATCH_SIZE = 100;
  const chunks: Array<Record<string, string>[]> = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    chunks.push(records.slice(i, i + BATCH_SIZE));
  }

  // Process first chunk in initial batch
  const firstChunk = chunks[0];
  for (const record of firstChunk) {
    const columns = ["airtable_id", "created_time"];
    const values: (string | null)[] = [record.id, new Date().toISOString()];
    const placeholders = ["?", "?"];

    // Add dynamic fields from schema
    for (const field of schema) {
      const value = record[field.name];
      if (value !== undefined) {
        columns.push(toSqlColumnName(field.name));
        values.push(convertValue(value));
        placeholders.push("?");
      }
    }

    const sql = `INSERT INTO records (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    statements.push(this.db.prepare(sql).bind(...values));
  }

  // Execute first batch atomically
  await this.db.batch(statements);

  // Process remaining chunks separately (if any)
  for (let i = 1; i < chunks.length; i++) {
    const chunkStatements: D1PreparedStatement[] = [];

    for (const record of chunks[i]) {
      const columns = ["airtable_id", "created_time"];
      const values: (string | null)[] = [record.id, new Date().toISOString()];
      const placeholders = ["?", "?"];

      for (const field of schema) {
        const value = record[field.name];
        if (value !== undefined) {
          columns.push(toSqlColumnName(field.name));
          values.push(convertValue(value));
          placeholders.push("?");
        }
      }

      const sql = `INSERT INTO records (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      chunkStatements.push(this.db.prepare(sql).bind(...values));
    }

    await this.db.batch(chunkStatements);
  }

  // Step 6: Populate FTS5 table from records table
  const populateFTS5SQL = buildPopulateFTS5SQL();
  await this.db.exec(populateFTS5SQL);
}
```

Add import at top:

```typescript
import { JOURNALIST_SCHEMA, toSqlColumnName, type SchemaField } from "../schema/journalist-schema";
```

**Step 3: Update initializeSchema method to use dynamic schema**

Modify `nuvoices-worker/src/services/database.ts`:

```typescript
/**
 * Initialize database schema using provided schema
 */
async initializeSchema(schema: SchemaField[]): Promise<void> {
  const createTableSQL = buildCreateTableSQL(schema);
  const createIndexSQL = buildCreateIndexSQL();
  const createFTS5SQL = buildCreateFTS5TableSQL();

  // Create table
  await this.db.exec(createTableSQL);

  // Create indexes
  for (const indexSQL of createIndexSQL) {
    await this.db.exec(indexSQL);
  }

  // Create FTS5 virtual table for full-text search
  await this.db.exec(createFTS5SQL);

  // Store schema for later use
  await this.storeSchema(schema);
}

/**
 * Store schema in a metadata table for later retrieval
 */
private async storeSchema(fields: SchemaField[]): Promise<void> {
  // Create schema metadata table if it doesn't exist
  await this.db.exec("CREATE TABLE IF NOT EXISTS _schema_metadata (id INTEGER PRIMARY KEY CHECK (id = 1), schema_json TEXT NOT NULL, updated_at TEXT NOT NULL)");

  // Store schema as JSON
  await this.db
    .prepare(`
      INSERT OR REPLACE INTO _schema_metadata (id, schema_json, updated_at)
      VALUES (1, ?, ?)
    `)
    .bind(JSON.stringify(fields), new Date().toISOString())
    .run();
}
```

**Step 4: Update type definitions**

Modify `nuvoices-worker/src/types.ts` to include SchemaField import:

```typescript
export interface Env {
  DB: D1Database;
  TIMESTAMP_URL?: string;  // Make optional
  CSV_URL: string;
}
```

**Step 5: Run type check**

Run: `cd nuvoices-worker && pnpm type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add nuvoices-worker/src/services/sync.ts nuvoices-worker/src/services/database.ts nuvoices-worker/src/types.ts
git commit -m "feat: update sync service to use dynamic schema and optional TIMESTAMP_URL"
```

---

## Task 4: Update Environment Configuration

**Files:**
- Modify: `nuvoices-worker/.dev.vars` (if exists)
- Create: `nuvoices-worker/.dev.vars.example`

**Step 1: Create example environment file**

Create `nuvoices-worker/.dev.vars.example`:

```bash
# Google Sheets CSV export URL (required)
CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mtuYo44HxBnYcnbUnB1COAZUajWSis70g10TomELXI2RIAKs5GqyMGgRsNYkNCF_o_m4fYQwRv96/pub?output=csv&gid=1920512850

# Google Sheets timestamp URL (optional - if not set, sync will run every time)
# TIMESTAMP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=timestamp
```

**Step 2: Update .dev.vars with new CSV_URL**

If `nuvoices-worker/.dev.vars` exists, update it:

```bash
CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mtuYo44HxBnYcnbUnB1COAZUajWSis70g10TomELXI2RIAKs5GqyMGgRsNYkNCF_o_m4fYQwRv96/pub?output=csv&gid=1920512850
# TIMESTAMP_URL is commented out since it's not working
```

**Step 3: Commit**

```bash
git add nuvoices-worker/.dev.vars.example
git commit -m "docs: update environment configuration with new CSV_URL and optional TIMESTAMP_URL"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `nuvoices-worker/README.md`

**Step 1: Update README to reflect changes**

Update the relevant sections in `nuvoices-worker/README.md`:

Add to the "CSV Structure" section:

```markdown
### CSV Structure

The Google Sheets export has the following structure:

- **Rows 1-2**: Metadata/header rows (skipped during parsing)
- **Row 3**: Column headers (dynamically extracted)
- **Rows 4+**: Data rows

All columns are stored as TEXT type in the database to preserve data integrity.

### Environment Variables

The worker requires the following environment variables:

- `CSV_URL` (required): Google Sheets CSV export URL
- `TIMESTAMP_URL` (optional): Apps Script timestamp endpoint for change detection
  - If not set, the worker will sync on every cron trigger
  - If set but unavailable, the worker will log a warning and proceed with sync

Example `.dev.vars`:

```bash
CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv&gid=YOUR_GID
# TIMESTAMP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=timestamp
```

### Dynamic Schema

The database schema is now dynamically generated from the CSV headers on each sync:

1. Parse CSV and extract headers from row 3
2. Create schema with all fields as TEXT type
3. Drop and recreate table with new schema
4. Insert all records

This approach ensures the worker adapts to schema changes in Google Sheets without code modifications.
```

**Step 2: Commit**

```bash
git add nuvoices-worker/README.md
git commit -m "docs: update README with CSV structure and dynamic schema info"
```

---

## Task 6: Manual Testing

**Files:**
- None (testing only)

**Step 1: Test CSV parsing with actual data**

Run: `cd nuvoices-worker && pnpm dev`

**Step 2: Trigger manual sync**

Run: `curl -X POST http://localhost:8787/sync`

Expected output:
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "timestamp": "2025-11-22T..."
}
```

Check logs for:
- "CSV must have at least 3 rows" error NOT present
- "Parsed X columns, Y rows" message
- "Created dynamic schema with X fields (all TEXT)"
- "TIMESTAMP_URL not configured, proceeding with sync" (if TIMESTAMP_URL is not set)
- "✅ Sync complete: Y records synced"

**Step 3: Verify records endpoint**

Run: `curl http://localhost:8787/records`

Expected: JSON response with records from the new CSV structure

**Step 4: Test with TIMESTAMP_URL not set**

Ensure `.dev.vars` does not have TIMESTAMP_URL set, restart dev server, and trigger sync again.

Expected: Sync succeeds with warning message about missing TIMESTAMP_URL

**Step 5: Test with invalid TIMESTAMP_URL**

Set TIMESTAMP_URL to invalid URL in `.dev.vars`:
```bash
TIMESTAMP_URL=https://invalid-url.example.com
```

Restart dev server and trigger sync.

Expected: Warning logged but sync still succeeds

---

## Task 7: Final Verification and Deployment Prep

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `cd nuvoices-worker && pnpm test`
Expected: All tests PASS

**Step 2: Run type checking**

Run: `cd nuvoices-worker && pnpm type-check`
Expected: No type errors

**Step 3: Build for production**

Run: `cd nuvoices-worker && pnpm build`
Expected: Build succeeds without errors

**Step 4: Review changes**

Run: `git log --oneline -7`
Expected: See all 7 commits from this plan

**Step 5: Final commit (if needed)**

If any adjustments were made during testing:

```bash
git add -A
git commit -m "chore: final adjustments after testing"
```

---

## Summary

This plan implements the following changes:

1. **CSV Parser**: Updated to skip first 2 rows and use row 3 as headers
2. **Schema**: Changed to dynamic TEXT-only fields extracted from CSV headers
3. **Sync Service**: Made TIMESTAMP_URL optional with graceful fallback
4. **Database**: Updated to accept dynamic schema parameter
5. **Documentation**: Updated README and added environment variable examples
6. **Testing**: Added comprehensive tests for new CSV parsing logic

The worker now:
- ✅ Skips the first 2 rows of CSV data
- ✅ Extracts column headers from row 3
- ✅ Treats all column values as TEXT
- ✅ Gracefully handles missing TIMESTAMP_URL
- ✅ Syncs on every cron trigger when TIMESTAMP_URL is not configured
- ✅ Logs warnings but continues if TIMESTAMP_URL is unreachable
