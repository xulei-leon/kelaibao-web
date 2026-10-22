import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WITHDRAWN_CONTENT } from "./src/content/articles";

const applicationRoot = dirname(fileURLToPath(import.meta.url));
const withdrawnPathsPattern = WITHDRAWN_CONTENT
  .map((path) => path.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const nextConfig: NextConfig = {
  // Keep development artifacts separate so `next build` cannot invalidate a
  // running development server's manifests.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  output: "standalone",
  outputFileTracingRoot: applicationRoot,
  poweredByHeader: false,
  // Next's built-in slash redirect runs before middleware. Let withdrawn URLs
  // reach the 410 handler directly, retaining normalization for every other URL.
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: withdrawnPathsPattern
          ? `/:path((?!(?:${withdrawnPathsPattern})/$).+)/`
          : "/:path+/",
        destination: "/:path",
        permanent: true,
      },
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
