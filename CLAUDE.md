# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for the nuvoices website, consisting of three main applications:
- **nuvoices-studio**: A Sanity CMS studio for content management
- **nuvoices-web**: A Next.js frontend application that consumes content from Sanity
- **nuvoices-worker**: A Cloudflare Worker that caches Google Sheets data in D1 database

## Development Commands

### Sanity Studio (nuvoices-studio/)
```bash
cd nuvoices-studio

# Development
pnpm dev               # Start dev server (uses Sanity CLI)
pnpm start            # Start production server
pnpm build            # Build the studio
pnpm deploy           # Deploy studio to Sanity
pnpm deploy-graphql   # Deploy GraphQL API
```

### Next.js Web App (nuvoices-web/)
```bash
cd nuvoices-web

# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Cloudflare Worker (nuvoices-worker/)
```bash
cd nuvoices-worker

# Development
pnpm dev              # Start local dev server (localhost:8787)
pnpm test             # Run tests with Vitest
pnpm type-check       # Run TypeScript type checking

# Database management
wrangler d1 list      # List D1 databases
wrangler tail         # View production logs

# Deployment
# Workers are deployed via Cloudflare Dashboard, not CLI
# See nuvoices-worker/README.md for deployment instructions
```

## Architecture

### Sanity Configuration
- Project ID: `6bg89hff`
- Dataset: `production`
- Schema defined in `nuvoices-studio/schemaTypes/`
- Currently has one content type: `expert` with name and languages fields

### Next.js App Structure
- Uses App Router with TypeScript
- Tailwind CSS for styling
- Sanity client configured in `src/sanity/client.ts`
- Environment variables required:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`

### Content Flow
1. Content is managed in Sanity Studio at `/nuvoices-studio`
2. Next.js app fetches content via `next-sanity` client
3. Expert listings at `/experts` with individual pages at `/experts/[expert]`

### Worker Configuration (nuvoices-worker/)
- **Purpose**: Google Sheets caching layer with REST API
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite) for persistent caching
- **Sync Strategy**: Cron-based (every 2 minutes) full table replacement
- **Data Source**: Google Sheets via Apps Script CSV export
- **Key Services**:
  - `sync.ts` - Orchestrates Google Sheets sync workflow
  - `database.ts` - Manages D1 database operations
- **Environment variables** (in `.dev.vars`):
  - `TIMESTAMP_URL` - Apps Script timestamp endpoint
  - `CSV_URL` - Apps Script CSV data endpoint
- **API Endpoints**:
  - `GET /` - Health check
  - `GET /records` - List with filtering, sorting, pagination
  - `GET /record/:id` - Get single record by ID
- **Data Flow**: Google Sheets → Apps Script → Cron Trigger → Worker → D1 → API
- **See** `nuvoices-worker/README.md` for comprehensive documentation

## Package Management
All projects use `pnpm` as the package manager. Always run commands from the specific project directory (nuvoices-studio, nuvoices-web, or nuvoices-worker).

## Code Style
- TypeScript throughout
- Prettier configured in studio with specific formatting rules
- ESLint configured for both projects
- Uses Next.js and Sanity conventions