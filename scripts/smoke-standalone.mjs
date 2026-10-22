import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";

function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolvePort(port));
    });
  });
}

async function waitFor(url, timeoutMs = 20_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return response;
    } catch {
      // The standalone server may still be starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(`Standalone smoke timed out for ${new URL(url).pathname}.`);
}

function assertPublicShellAbsent(html, pathname) {
  for (const marker of [
    'class="site-header"',
    'class="site-footer"',
    "免费体验",
    'type="application/ld+json"',
  ]) {
    if (html.includes(marker)) {
      throw new Error(`Public shell marker ${marker} leaked into ${pathname}.`);
    }
  }
}

async function generatedAssetPath() {
  const manifest = await readFile(
    resolve(process.cwd(), "src/content/responsive-assets.generated.ts"),
    "utf8",
  );
  const match = manifest.match(/"fallbackSrc":\s*"([^"?]+\.webp)"/);
  if (!match?.[1]?.startsWith("/visual/generated/")) {
    throw new Error("Responsive asset manifest has no generated fallback URL.");
  }
  return match[1];
}

const port = await availablePort();
const server = spawn(
  process.execPath,
  [resolve(process.cwd(), ".next/standalone/server.js")],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      SINO_RUNTIME_MODE: "production",
      DATABASE_URL: "",
      DATABASE_ADAPTER: "",
      ADMIN_CSRF_SECRET: "",
      ADMIN_DUMMY_PASSWORD_HASH: "",
      SINO_APP_VERSION: "m2-01-local-smoke",
    },
    stdio: "ignore",
    windowsHide: true,
  },
);

try {
  const origin = `http://127.0.0.1:${port}`;
  const health = await waitFor(`${origin}/api/health`);
  const healthText = await health.text();
  if (
    !health.headers.get("content-type")?.includes("application/json") ||
    health.headers.get("cache-control") !== "private, no-store, max-age=0" ||
    /<html|site-header|site-footer/i.test(healthText)
  ) {
    throw new Error("Health Route Handler returned HTML or unsafe caching.");
  }
  const healthBody = JSON.parse(healthText);
  if (
    healthBody.status !== "ok" ||
    healthBody.version !== "m2-01-local-smoke"
  ) {
    throw new Error("Runtime-only version was not read by the health route.");
  }

  const ssr = await waitFor(`${origin}/health`);
  const ssrHtml = await ssr.text();
  if (!ssrHtml.includes("m2-01-standalone-ssr")) {
    throw new Error("Dynamic SSR marker missing from standalone response.");
  }
  assertPublicShellAbsent(ssrHtml, "/health");

  for (const pathname of ["/admin", "/admin/login", "/api/admin/content", "/api/internal/cache-purge"]) {
    const retired = await fetch(`${origin}${pathname}`, { redirect: "manual" });
    if (retired.status !== 404) throw new Error(`Retired CMS route remains available: ${pathname}`);
  }
  for (const [pathname, marker] of [["/news", "新闻动态"], ["/cases", "案例"], ["/sitemap.xml", "<urlset"], ["/feed.xml", "<rss"], ["/llms.txt", "实验性"]]) {
    const response = await waitFor(`${origin}${pathname}`);
    if (!(await response.text()).includes(marker)) throw new Error(`Static content missing: ${pathname}`);
  }
  for (const pathname of ["/news/unknown-static-smoke", "/cases/unknown-static-smoke"]) {
    if ((await fetch(`${origin}${pathname}`)).status !== 404) throw new Error("Unknown static article must be 404.");
  }
  for (const pathname of ["/trial/", "/about/", "/news/article-a/", "/news/unknown-static-smoke/"]) {
    const response = await fetch(`${origin}${pathname}?smoke=slash`, { redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status !== 308 || !location || new URL(location, origin).href !== `${origin}${pathname.slice(0, -1)}?smoke=slash`) {
      throw new Error(`Non-withdrawn URL must retain trailing-slash normalization and query: ${pathname}`);
    }
  }
  const manifest = JSON.parse(await readFile(resolve(process.cwd(), ".next/standalone/static-content-manifest.json"), "utf8"));
  for (const route of manifest.routes) {
    const response = await fetch(`${origin}${route.path}`, { redirect: "manual" });
    if (response.status !== route.status) throw new Error(`Static route status mismatch: ${route.path}`);
    if (route.status === 410) {
      const trailing = await fetch(`${origin}${route.path}/`, { redirect: "manual" });
      if (trailing.status !== 410 || !trailing.headers.get("x-robots-tag")?.includes("noindex")) {
        throw new Error(`Withdrawn route with trailing slash must return 410 and noindex: ${route.path}/`);
      }
    }
    if (route.status === 308 && response.headers.get("location") !== `${origin}${route.to}`) throw new Error("Content redirect destination mismatch.");
  }

  const home = await waitFor(`${origin}/`);
  const homeHtml = await home.text();
  if (!homeHtml.includes("客来宝")) {
    throw new Error("Existing public page is missing from standalone response.");
  }
  for (const marker of [
    'class="site-header"',
    'class="site-footer"',
    "免费体验",
    'type="application/ld+json"',
  ]) {
    if (!homeHtml.includes(marker)) {
      throw new Error(`Public shell marker ${marker} is missing from home.`);
    }
  }
  if (homeHtml.includes("/_next/image")) {
    throw new Error("Home unexpectedly depends on the Next image optimizer.");
  }

  const responsivePath = await generatedAssetPath();
  const responsiveImage = await waitFor(`${origin}${responsivePath}`);
  const responsiveBytes = Buffer.from(await responsiveImage.arrayBuffer());
  if (
    !responsiveImage.headers.get("content-type")?.includes("image/webp") ||
    responsiveImage.headers.get("cache-control") !==
      "public, max-age=31536000, immutable" ||
    responsiveBytes.length < 100 ||
    responsiveBytes.toString("ascii", 0, 4) !== "RIFF" ||
    responsiveBytes.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error("Packaged responsive WebP or immutable cache contract is invalid.");
  }

  const openGraphImage = await waitFor(`${origin}/opengraph-image`);
  const openGraphBytes = Buffer.from(await openGraphImage.arrayBuffer());
  if (
    !openGraphImage.headers.get("content-type")?.includes("image/png") ||
    openGraphBytes.length < 10_000 ||
    !openGraphBytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    throw new Error("Packaged Open Graph PNG or build-time font rendering is invalid.");
  }

  const inquiry = await fetch(`${origin}/api/inquiry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "standalone-smoke-0001",
      "X-ESA-Client-IP": "203.0.113.8",
    },
    body: JSON.stringify({
      name: "测试访客",
      profession: "other",
      contactMethod: "wechat",
      contactValue: "test-contact",
      needs: "这是不发送到真实服务的 standalone 配置失败验证。",
      privacyConsent: true,
    }),
  });
  if (
    inquiry.status !== 503 ||
    inquiry.headers.get("cache-control") !== "private, no-store, max-age=0"
  ) {
    throw new Error("Unconfigured inquiry route did not fail closed without caching.");
  }
  const inquiryBody = await inquiry.json();
  if (
    inquiryBody.code !== "service_unavailable" ||
    JSON.stringify(inquiryBody).includes("DIRECTMAIL_")
  ) {
    throw new Error("Inquiry route exposed configuration details.");
  }

  console.log(
    "Standalone SSR, Route Handler, responsive WebP, OG PNG, runtime env, and public page smoke: PASS",
  );
} finally {
  server.kill();
}
