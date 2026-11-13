import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      // Cloudflare R2: r2.dev dev URLs and the custom media domain
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.jamescrovo.com" },
      { protocol: "https", hostname: "s4.anilist.co" },
    ],
  },
};

export default nextConfig;
