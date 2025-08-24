# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for the nuvoices website, consisting of two main applications:
- **nuvoices-studio**: A Sanity CMS studio for content management
- **nuvoices-web**: A Next.js frontend application that consumes content from Sanity

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

## Package Management
Both projects use `pnpm` as the package manager. Always run commands from the specific project directory (nuvoices-studio or nuvoices-web).

## Code Style
- TypeScript throughout
- Prettier configured in studio with specific formatting rules
- ESLint configured for both projects
- Uses Next.js and Sanity conventions