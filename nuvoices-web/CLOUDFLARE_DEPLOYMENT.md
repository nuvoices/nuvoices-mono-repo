# Cloudflare Pages Deployment Guide

## Current Status

The project is configured for Next.js static site generation (SSG) using `generateStaticParams`, which is incompatible with Cloudflare Pages deployment through `@cloudflare/next-on-pages`.

## The Issue

- Cloudflare Pages requires `export const runtime = 'edge'` for all dynamic routes
- Next.js doesn't allow both `runtime = 'edge'` and `generateStaticParams` in the same page
- This creates a fundamental incompatibility between SSG and Cloudflare Pages

## Solution Options

### Option 1: Deploy to Vercel (Recommended)
The project is already optimized for Vercel deployment:
```bash
pnpm build
# Deploy to Vercel using their CLI or GitHub integration
```

### Option 2: Deploy Static Export to Cloudflare Pages
Convert to full static export (requires removing dynamic routes):
1. Set `output: "export"` in next.config.ts
2. Ensure all pages have `generateStaticParams` that return all possible paths
3. Build: `pnpm build`
4. Deploy the `out` directory to Cloudflare Pages

### Option 3: Remove SSG for Cloudflare Compatibility
To deploy with edge runtime (loses static generation benefits):
1. Remove `generateStaticParams` from all dynamic pages
2. Add `export const runtime = "edge"` to all dynamic pages
3. Run `pnpm pages:build`
4. Deploy with `pnpm pages:deploy`

### Option 4: Use Cloudflare Workers Sites
Deploy the static build output directly:
1. Build normally: `pnpm build`
2. Use Cloudflare Workers Sites to serve the `.next` directory

## Current Configuration

The project currently:
- Builds successfully with `pnpm build`
- Uses SSG for optimal performance
- Is ready for deployment to Vercel or any Node.js hosting platform

## Recommendation

Given the project's use of Sanity CMS and static generation, deploying to Vercel or Netlify would provide better compatibility and performance than forcing edge runtime compatibility for Cloudflare Pages.