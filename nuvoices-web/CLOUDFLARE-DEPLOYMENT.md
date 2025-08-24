# Cloudflare Pages Deployment Guide for nuvoices-web

## Overview

This guide explains how to deploy the nuvoices-web Next.js application to Cloudflare Pages. Due to compatibility issues with Next.js 15's static export and dynamic routes, we strongly recommend using Cloudflare's Next.js adapter approach.

> **Note**: Next.js 15 has a known issue with `output: "export"` and dynamic routes using `generateStaticParams`. The standard build works fine, but static export fails. Use Option 1 below for deployment.

## Deployment Options

### Option 1: Using @cloudflare/next-on-pages (Recommended)

This approach uses Cloudflare's official adapter for Next.js, which provides better compatibility with dynamic routes and server-side features.

1. **Install the adapter:**
   ```bash
   pnpm add -D @cloudflare/next-on-pages
   ```

2. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "pages:build": "pnpm next-on-pages",
       "pages:dev": "pnpm wrangler pages dev .vercel/output/static --compatibility-date=2023-12-18 --compatibility-flag=nodejs_compat",
       "pages:deploy": "pnpm wrangler pages deploy .vercel/output/static --compatibility-date=2023-12-18 --compatibility-flag=nodejs_compat"
     }
   }
   ```

3. **Remove the static export configuration from next.config.ts:**
   ```typescript
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     // Remove: output: "export",
     images: {
       unoptimized: true,
     },
   };

   export default nextConfig;
   ```

4. **Build for Cloudflare Pages:**
   ```bash
   pnpm build
   pnpm pages:build
   ```

5. **Deploy to Cloudflare Pages:**
   - In your Cloudflare Pages project settings:
   - Build command: `pnpm build && pnpm pages:build`
   - Build output directory: `.vercel/output/static`
   - Environment variables:
     - `NEXT_PUBLIC_SANITY_PROJECT_ID`: Your Sanity project ID
     - `NEXT_PUBLIC_SANITY_DATASET`: Your Sanity dataset (e.g., "production")

### Option 2: Static Export (Current Setup)

If you prefer to use the static export approach we've configured:

1. **Ensure all dynamic routes have generateStaticParams:**
   - `/experts/[expert]/page.tsx` ✓
   - `/magazine/[slug]/page.tsx` ✓
   - `/news/[slug]/page.tsx` ✓
   - `/podcast/[slug]/page.tsx` ✓

2. **Build the static site:**
   ```bash
   pnpm build
   ```

3. **Deploy to Cloudflare Pages:**
   - Build command: `pnpm build`
   - Build output directory: `out`
   - Environment variables:
     - `NEXT_PUBLIC_SANITY_PROJECT_ID`: Your Sanity project ID
     - `NEXT_PUBLIC_SANITY_DATASET`: Your Sanity dataset

## Cloudflare-Specific Files

We've added the following files for Cloudflare Pages optimization:

- **`public/_headers`**: Custom headers for security and caching
- **`public/_redirects`**: URL redirects configuration

## Troubleshooting

### Issue: "Page is missing generateStaticParams()"

This error occurs when Next.js 15 cannot find the generateStaticParams function in dynamic routes. Solutions:

1. Ensure the function is properly exported
2. Check that the function returns an array of objects with the correct parameter names
3. Consider using Option 1 (next-on-pages) instead

### Issue: Build fails with Sanity fetch errors

1. Verify environment variables are set correctly
2. Ensure Sanity dataset is accessible
3. Add error handling to generateStaticParams functions (already implemented)

## Performance Optimization

1. **Images**: We've configured `unoptimized: true` for static export. Consider using Cloudflare Images for optimization.

2. **Caching**: The `_headers` file includes cache control headers for static assets.

3. **Edge Functions**: If using Option 1, you can leverage Cloudflare Workers for dynamic functionality.

## Monitoring

After deployment:

1. Check Cloudflare Pages dashboard for build logs
2. Monitor Web Analytics for performance metrics
3. Set up error tracking for runtime issues

## Next Steps

1. Choose your deployment option (Option 1 recommended)
2. Set up environment variables in Cloudflare Pages
3. Configure custom domain if needed
4. Enable Cloudflare Web Analytics

For more information, see:
- [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)