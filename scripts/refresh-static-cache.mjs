import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { DirectHttpsEsaPurgeProvider, resolveEsaPurgeConfig } from "./lib/esa-purge.mjs";

const argument = (name) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
try {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("invalid_origin");
  const manifest = JSON.parse(await readFile(".next/static-content-manifest.json", "utf8"));
  const previousPath = argument("--previous-manifest");
  if (process.argv.includes("--apply") && !previousPath) throw new Error("previous_manifest_required");
  const previous = previousPath ? JSON.parse(await readFile(previousPath, "utf8")) : { routes: [] };
  const paths = [...new Set(["/", "/about", "/news", "/cases", "/sitemap.xml", "/feed.xml", "/llms.txt", ...manifest.routes.map((r) => r.path), ...previous.routes.map((r) => r.path)])].sort();
  const urls = paths.map((path) => {
    if (!/^\/(?:[a-z0-9]+(?:[./-][a-z0-9]+)*)?$/.test(path) || path.includes("..")) throw new Error("invalid_path");
    return new URL(path, origin).href;
  });
  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({ mode: "dry-run", urls }, null, 2));
  } else {
    const provider = new DirectHttpsEsaPurgeProvider(resolveEsaPurgeConfig());
    for (let index = 0; index < urls.length; index += 6) {
      const batch = urls.slice(index, index + 6);
      const idempotencyKey = createHash("sha256").update(JSON.stringify({ sourceDigest: manifest.sourceDigest, batch })).digest("hex");
      await provider.purgeUrls({ urls: batch, idempotencyKey });
    }
    console.log(`ESA accepted ${urls.length} exact URL refreshes. Verify task completion and actual responses before opening traffic; acceptance is not release approval.`);
  }
} catch {
  console.error("Static cache refresh failed. Stop release or roll back. Verify manifests, canonical HTTPS origin and release-only ESA credentials; no provider response or credentials are logged.");
  process.exitCode = 1;
}
