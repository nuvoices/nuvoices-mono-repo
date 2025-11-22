# Nuvoices Worker - Google Sheets Caching Layer

A Cloudflare Worker that acts as a caching layer for Google Sheets using D1 database. Provides fast API access to your data with filtering, sorting, and pagination capabilities.

## Features

- **Google Sheets Integration**: Direct CSV-based sync from Google Sheets via Apps Script
- **Persistent Caching**: Uses Cloudflare D1 (SQLite) for durable data storage
- **Cron-based Sync**: Automatically syncs every 2 minutes via Cloudflare Cron Triggers
- **Full Table Replacement**: Simple, atomic sync strategy for small datasets (<1000 records)
- **Timestamp Comparison**: Only syncs when Google Sheets data has changed
- **Full-Text Search**: FTS5-powered partial search with automatic prefix matching
- **Flexible Filtering**: Dynamic query parameters with operators (`>`, `<`, `>=`, `<=`, `!=`, `*`)
- **Pagination**: Configurable page size with full metadata
- **Type-Safe**: Full TypeScript implementation
- **Clean Architecture**: Separation of concerns with services, routes, and utilities
- **Comprehensive Testing**: Unit and integration tests with Vitest

## Architecture

```
src/
├── index.ts                  # Main Hono app
├── scheduled.ts              # Cron trigger handler
├── types/
│   └── index.ts             # TypeScript types
├── services/
│   ├── sync.ts              # Google Sheets sync orchestration
│   └── database.ts          # D1 database operations
├── routes/
│   ├── records.ts           # GET /records
│   └── record.ts            # GET /record/:id
├── middleware/
│   ├── error.ts             # Error handling
│   └── logger.ts            # Request logging
└── utils/
    ├── csv-parser.ts        # CSV parsing and schema inference
    ├── query-builder.ts     # SQL query construction
    └── pagination.ts        # Pagination helpers
```

## How It Works

### Sync Strategy

1. **Cloudflare Cron Trigger** fires every 2 minutes
2. Worker calls Google Apps Script **timestamp endpoint** to get last modified time
3. Compares with last sync timestamp stored in D1 metadata table
4. If unchanged, skips sync (efficient, no unnecessary work)
5. If changed:
   - Fetches full CSV data from Apps Script
   - Parses CSV and infers schema
   - **Atomically replaces entire table** (DROP → CREATE → INSERT)
   - Updates last sync timestamp
6. On error, keeps old data intact (resilient)

### Apps Script Setup

You need TWO Apps Script endpoints:

#### 1. Timestamp Endpoint
Returns when the sheet was last modified:
```json
{
  "spreadsheetId": "1abc...",
  "lastUpdated": "2025-10-12T11:41:50.166Z"
}
```

#### 2. CSV Data Endpoint
Returns full sheet data as CSV text (see `test/constants/mockSheetsCSV.txt` for format)

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Cloudflare account (for deployment)
- Google Sheet with data (first row must be headers)

## Setup

### 1. Install Dependencies

```bash
cd nuvoices-worker
pnpm install
```

### 2. Create D1 Database

```bash
# Create local D1 database for development
wrangler d1 create google-sheets-cache-local

# Create production D1 database
wrangler d1 create google-sheets-cache-production
```

Copy the database IDs from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "google-sheets-cache"
database_id = "your-local-database-id"

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "google-sheets-cache-production"
database_id = "your-production-database-id"
```

### 3. Configure Environment Variables

The worker requires the following environment variables:

- `CSV_URL` (required): Google Sheets CSV export URL
- `TIMESTAMP_URL` (optional): Apps Script timestamp endpoint for change detection
  - If not set, the worker will sync on every cron trigger
  - If set but unavailable, the worker will log a warning and proceed with sync

Create `.dev.vars` file for local development:

```env
CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv&gid=YOUR_GID
# TIMESTAMP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=timestamp
```

**Setting up CSV_URL:**

1. Open your Google Sheet
2. Go to **File > Share > Publish to web**
3. Select the specific sheet and choose "Comma-separated values (.csv)"
4. Copy the published URL

**Setting up TIMESTAMP_URL (optional):**

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Create a `doGet(e)` function that returns timestamp when `e.parameter.action === 'timestamp'`
4. Deploy as **Web App** (Execute as: Me, Access: Anyone)
5. Copy the deployment URL and append `?action=timestamp`

For production, set these as environment variables in Cloudflare dashboard or use secrets:

```bash
wrangler secret put CSV_URL
wrangler secret put TIMESTAMP_URL  # Optional
```

### 4. Configure Cron Trigger

The `wrangler.toml` file already includes the cron configuration:

```toml
[triggers]
crons = ["*/2 * * * *"]  # Every 2 minutes
```

You can adjust the frequency as needed (e.g., `*/5 * * * *` for every 5 minutes).

## Development

### Start Development Server

```bash
pnpm dev
```

The worker will be available at `http://localhost:8787`

**Note:** Cron triggers don't run in local development. To test sync:
1. Call the sync function directly, OR
2. Deploy to Cloudflare Workers (free tier supports cron triggers)

### Run Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

### Type Checking

```bash
pnpm type-check
```

## API Endpoints

### GET /

Health check endpoint.

**Response:**
```json
{
  "service": "Google Sheets Cache Worker",
  "status": "healthy",
  "version": "2.0.0",
  "description": "Cron-based sync from Google Sheets to D1 Database",
  "endpoints": {
    "records": "GET /records - List all records with filtering and pagination",
    "record": "GET /record/:id - Get a single record by ID"
  },
  "sync": {
    "strategy": "cron-pull",
    "frequency": "every 2 minutes"
  },
  "timestamp": "2025-10-12T00:00:00.000Z"
}
```

### GET /records

List all records with filtering, sorting, pagination, and full-text search.

**Query Parameters:**

- `search` (string): Full-text search query with automatic partial matching
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Records per page
- `sort` (string): Field name to sort by
- `order` (string: "asc" | "desc", default: "desc"): Sort order
- Any field name for filtering (e.g., `name=John`, `age=>18`, `status!=active`)

**Full-Text Search:**

The `search` parameter provides powerful partial matching across all text fields:

- **Automatic prefix matching**: Searching "man" matches "Mandarin", "Manager", "Manual", etc.
- **Multi-term search**: "man chi" finds records containing both terms
- **Searches across all fields**: name, email, languages, country, city, specializations, etc.
- **Fast performance**: Uses SQLite FTS5 full-text index

Examples:
```bash
# Find records with "mandarin" or "manager" (partial match)
curl "http://localhost:8787/records?search=man"

# Find records with both "chinese" AND "english"
curl "http://localhost:8787/records?search=chi eng"

# Search with pagination
curl "http://localhost:8787/records?search=jour&page=1&limit=10"
```

**Filter Operators:**

- Exact match: `field=value`
- Greater than: `field=>value` or `field=>=value`
- Less than: `field=<value` or `field=<=value`
- Not equal: `field=!=value`
- LIKE pattern: `field=value*` (wildcards with `*`)

**Note:** When using the `search` parameter, it takes precedence and filters are ignored.

**Examples:**

```bash
# Get first page (default 20 records)
curl http://localhost:8787/records

# Full-text search (partial matching)
curl "http://localhost:8787/records?search=man"

# Multi-term search
curl "http://localhost:8787/records?search=mandarin journalist"

# Custom pagination
curl http://localhost:8787/records?page=2&limit=50

# Sort by name ascending
curl http://localhost:8787/records?sort=name&order=asc

# Filter by exact match
curl http://localhost:8787/records?status=active

# Filter with operators
curl http://localhost:8787/records?age=>18&name=John*

# Combine filters, sorting, and pagination
curl "http://localhost:8787/records?status=active&age=>18&sort=created_time&order=desc&page=1&limit=25"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "airtable_id": "row_2",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /record/:id

Get a single record by ID.

**Parameters:**

- `id` (string): Record ID (e.g., `row_2`, `row_3`)

**Example:**

```bash
curl http://localhost:8787/record/row_2
```

**Response:**
```json
{
  "id": 1,
  "airtable_id": "row_2",
  "name": "John Doe",
  "email": "john@example.com",
  ...
}
```

**Error Response (404):**
```json
{
  "error": "Not Found",
  "message": "Record not found: row_2",
  "status": 404,
  "timestamp": "2025-10-12T00:00:00.000Z"
}
```

## Deployment

### Deploy to Cloudflare Workers

```bash
# Deploy to production
pnpm deploy

# Deploy to staging (if configured)
wrangler deploy --env staging
```

### Set Production Environment Variables

```bash
wrangler secret put TIMESTAMP_URL
wrangler secret put CSV_URL
```

## Performance Characteristics

- **Sync Frequency**: Every 2 minutes
- **Sync Duration**: ~2-5 seconds for 1000 records
- **Query Performance**: Fast (serves from D1 cache)
- **Atomicity**: No moment where table is empty (batch operation)
- **Error Handling**: Old data remains intact if sync fails

## CSV Structure

The Google Sheets export has the following structure:

- **Rows 1-2**: Metadata/header rows (skipped during parsing)
- **Row 3**: Column headers (dynamically extracted)
- **Rows 4+**: Data rows

All columns are stored as TEXT type in the database to preserve data integrity.

**Requirements:**
- Quoted fields with commas are supported: `"English, Spanish"`
- Record IDs are auto-generated: `row_4`, `row_5`, etc. (starting from row 4 since rows 1-3 are headers/metadata)

See `test/constants/mockSheetsCSV.txt` for a complete example.

## Dynamic Schema

The database schema is now dynamically generated from the CSV headers on each sync:

1. Parse CSV and extract headers from row 3
2. Create schema with all fields as TEXT type
3. Drop and recreate table with new schema
4. Insert all records

This approach ensures the worker adapts to schema changes in Google Sheets without code modifications. All column values are stored as TEXT type to preserve data integrity and avoid type conversion issues.

## Error Handling

All errors return consistent JSON format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "status": 400,
  "timestamp": "2025-10-12T00:00:00.000Z"
}
```

**Common Status Codes:**

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (record doesn't exist)
- `500`: Internal Server Error (Apps Script failure, DB error)

## Troubleshooting

### Sync Not Working

- Check `TIMESTAMP_URL` and `CSV_URL` are correct
- Verify Apps Script is deployed as Web App
- Check Apps Script permissions (Execute as: Me, Access: Anyone)
- View logs: `wrangler tail` (production) or console (local)

### Database Issues

- Verify D1 database exists: `wrangler d1 list`
- Check database ID in `wrangler.toml` is correct
- Reset database: `wrangler d1 execute google-sheets-cache --command="DROP TABLE IF EXISTS records"`

### Tests Failing

- Run `pnpm install` to ensure dependencies are installed
- Check Node.js version is >= 18
- Verify wrangler.toml is properly configured

## Development Tips

### Viewing D1 Database

```bash
# Local database
wrangler d1 execute google-sheets-cache-local --local --command="SELECT * FROM records LIMIT 10"

# Production database
wrangler d1 execute google-sheets-cache-production --command="SELECT COUNT(*) FROM records"

# View last sync time
wrangler d1 execute google-sheets-cache-production --command="SELECT * FROM _sync_metadata"
```

### Testing Sync Manually

```bash
# View worker logs
wrangler tail

# Trigger sync by waiting for cron (every 2 minutes)
# Or deploy and monitor logs
```

### Resetting Database

```bash
# Drop table to force re-initialization
wrangler d1 execute google-sheets-cache-local --local --command="DROP TABLE IF EXISTS records"

# Clear sync metadata
wrangler d1 execute google-sheets-cache-local --local --command="DELETE FROM _sync_metadata"
```

## License

MIT

## Support

For issues or questions, please check the project documentation or create an issue in the repository.
