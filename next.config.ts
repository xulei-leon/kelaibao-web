import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const applicationRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep development artifacts separate so `next build` cannot invalidate a
  // running development server's manifests.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  output: "standalone",
  outputFileTracingRoot: applicationRoot,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/about#contact",
        permanent: true,
      },
      {
        source: "/services",
        destination: "/media#services",
        permanent: true,
      },
      {
        source: "/for/direct-sales",
        destination: "/media#direct-sales",
        permanent: true,
      },
      {
        source: "/for/insurance",
        destination: "/media#insurance",
        permanent: true,
      },
      {
        source: "/for/securities",
        destination: "/media#securities",
        permanent: true,
      },
      {
        source: "/method",
        destination: "/media#method",
        permanent: true,
      },
    ];
  },
  async headers() {
    const noStoreHeaders = [
      {
        key: "Cache-Control",
        value: "private, no-store, max-age=0",
      },
    ];

    return [
      {
        source: "/visual/generated/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      { source: "/admin/:path*", headers: noStoreHeaders },
      { source: "/api/:path*", headers: noStoreHeaders },
      { source: "/health", headers: noStoreHeaders },
    ];
  },
};

export default nextConfig;
