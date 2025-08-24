import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Cloudflare Pages deployment
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
