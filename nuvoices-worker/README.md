# Nuvoices Worker - Airtable Caching Layer

A Cloudflare Worker that acts as a caching layer for Airtable tables using D1 database. Provides fast API access to Airtable data with filtering, sorting, and pagination capabilities.

## Features

- **Persistent Caching**: Uses Cloudflare D1 (SQLite) for durable data storage
- **Lazy Loading**: Automatically fetches from Airtable on first request
- **Webhook Support**: Incremental updates via Airtable webhooks
- **Flexible Filtering**: Dynamic query parameters with operators (`>`, `<`, `>=`, `<=`, `!=`, `*`)
- **Pagination**: Configurable page size with full metadata
- **Type-Safe**: Full TypeScript implementation
- **Clean Architecture**: Separation of concerns with services, routes, and utilities
- **Comprehensive Testing**: Unit and integration tests with Vitest

## Architecture

```
src/
├── index.ts                  # Main Hono app
├── types/
│   └── index.ts             # TypeScript types
├── services/
│   ├── airtable.ts          # Airtable API client
│   └── database.ts          # D1 database operations
├── routes/
│   ├── records.ts           # GET /records
│   ├── record.ts            # GET /record/:id
│   └── webhook.ts           # POST /airtable
├── middleware/
│   ├── error.ts             # Error handling
│   └── logger.ts            # Request logging
└── utils/
    ├── query-builder.ts     # SQL query construction
    └── pagination.ts        # Pagination helpers
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Cloudflare account (for deployment)
- Airtable account with API access

## Setup

### 1. Install Dependencies

```bash
cd nuvoices-worker
pnpm install
```

### 2. Create D1 Database

```bash
# Create local D1 database for development
wrangler d1 create airtable-cache-local

# Create production D1 database
wrangler d1 create airtable-cache-production
```

Copy the database IDs from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "airtable-cache"
database_id = "your-local-database-id"

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "airtable-cache-production"
database_id = "your-production-database-id"
```

### 3. Configure Environment Variables

Create `.dev.vars` file for local development:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your Airtable credentials:

```env
ACCESS_TOKEN=your_airtable_personal_access_token
BASE_ID=your_airtable_base_id
TABLE_NAME=your_airtable_table_name
```

**Getting Airtable Credentials:**

- **ACCESS_TOKEN**: Create at https://airtable.com/create/tokens
- **BASE_ID**: Found in your Airtable URL: `https://airtable.com/BASE_ID/...`
- **TABLE_NAME**: The name of your table (case-sensitive)

For production, set these as secrets:

```bash
wrangler secret put ACCESS_TOKEN
wrangler secret put BASE_ID
wrangler secret put TABLE_NAME
```

## Development

### Start Development Server

```bash
pnpm dev
```

The worker will be available at `http://localhost:8787`

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
  "service": "Airtable Cache Worker",
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /records

List all records with filtering, sorting, and pagination.

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Records per page
- `sort` (string): Field name to sort by
- `order` (string: "asc" | "desc", default: "desc"): Sort order
- Any field name for filtering (e.g., `name=John`, `age=>18`, `status!=active`)

**Filter Operators:**

- Exact match: `field=value`
- Greater than: `field=>value` or `field=>=value`
- Less than: `field=<value` or `field=<=value`
- Not equal: `field=!=value`
- LIKE pattern: `field=value*` (wildcards with `*`)

**Examples:**

```bash
# Get first page (default 20 records)
curl http://localhost:8787/records

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
      "airtable_id": "recABC123",
      "created_time": "2024-01-01T00:00:00.000Z",
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

Get a single record by Airtable ID.

**Parameters:**

- `id` (string): Airtable record ID (e.g., `recABC123`)

**Example:**

```bash
curl http://localhost:8787/record/recABC123
```

**Response:**
```json
{
  "id": 1,
  "airtable_id": "recABC123",
  "created_time": "2024-01-01T00:00:00.000Z",
  "name": "John Doe",
  "email": "john@example.com",
  ...
}
```

**Error Response (404):**
```json
{
  "error": "Not Found",
  "message": "Record not found: recABC123",
  "status": 404,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /airtable

Webhook endpoint for Airtable updates. Configure this in your Airtable base automation.

**Webhook Payload:**

```json
{
  "base": {
    "id": "appXXXXXXXXXXXXXX"
  },
  "webhook": {
    "id": "achXXXXXXXXXXXXXX"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "createdRecordsById": { ... },
  "changedRecordsById": { ... },
  "destroyedRecordIds": [ ... ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed webhook: 2 created, 3 updated, 1 deleted",
  "data": {
    "created": 2,
    "updated": 3,
    "deleted": 1
  }
}
```

**Setting up Airtable Webhook:**

1. Go to your Airtable base
2. Click "Automations" in the top menu
3. Create a new automation with trigger "When record is created/updated/deleted"
4. Add action "Send webhook" with URL: `https://your-worker.workers.dev/airtable`
5. Configure payload to include record data

## Deployment

### Deploy to Cloudflare Workers

```bash
# Deploy to production
pnpm deploy

# Deploy to staging (if configured)
wrangler deploy --env staging
```

### Set Production Secrets

```bash
wrangler secret put ACCESS_TOKEN
wrangler secret put BASE_ID
wrangler secret put TABLE_NAME
```

## How It Works

### Initial Cache Population (Lazy Loading)

1. When `GET /records` is called for the first time
2. Worker checks if D1 database is initialized
3. If empty, fetches all records from Airtable API
4. Infers schema from records (field names and types)
5. Creates D1 table with dynamic schema
6. Bulk inserts all records
7. Returns paginated results

### Incremental Updates (Webhooks)

1. Airtable sends webhook when records change
2. Worker receives POST request at `/airtable`
3. Validates base ID matches configuration
4. Processes created, updated, and deleted records
5. Updates D1 database incrementally
6. Returns success response

### Query Execution

1. Parse query parameters (filters, sort, pagination)
2. Build SQL query dynamically
3. Execute against D1 database
4. Return results with pagination metadata

## Performance Characteristics

- **First Request**: Slower (fetches from Airtable, initializes DB)
- **Subsequent Requests**: Fast (serves from D1 cache)
- **Updates**: Near real-time via webhooks
- **Pagination**: Efficient with SQL LIMIT/OFFSET
- **Filtering**: Database-level filtering (fast)

## Error Handling

All errors return consistent JSON format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "status": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Common Status Codes:**

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (record doesn't exist)
- `500`: Internal Server Error (Airtable API failure, DB error)

## Troubleshooting

### Database Not Initializing

- Check `.dev.vars` has correct Airtable credentials
- Verify BASE_ID and TABLE_NAME are correct
- Check Airtable API token has read permissions

### Webhook Not Working

- Verify webhook URL is publicly accessible
- Check BASE_ID in webhook payload matches configuration
- Ensure Airtable automation is enabled

### Tests Failing

- Run `pnpm install` to ensure dependencies are installed
- Check Node.js version is >= 18
- Verify wrangler.toml is properly configured

## Development Tips

### Viewing D1 Database

```bash
# Local database
wrangler d1 execute airtable-cache-local --local --command="SELECT * FROM records LIMIT 10"

# Production database
wrangler d1 execute airtable-cache-production --command="SELECT COUNT(*) FROM records"
```

### Testing Webhooks Locally

```bash
curl -X POST http://localhost:8787/airtable \
  -H "Content-Type: application/json" \
  -d '{
    "base": {"id": "your_base_id"},
    "webhook": {"id": "test"},
    "timestamp": "2024-01-01T00:00:00.000Z",
    "createdRecordsById": {}
  }'
```

### Resetting Database

```bash
# Drop table to force re-initialization
wrangler d1 execute airtable-cache-local --local --command="DROP TABLE IF EXISTS records"
```

## License

MIT

## Support

For issues or questions, please check the project documentation or create an issue in the repository.
