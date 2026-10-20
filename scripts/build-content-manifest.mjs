import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import ts from "typescript";

// This is trusted repository code, just like next build. No database or network.
const source = await readFile("src/content/articles.ts", "utf8");
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { ARTICLES, WITHDRAWN_CONTENT, CONTENT_REDIRECTS } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
const routes = [
  ...ARTICLES.map((item) => ({ path: `/${item.contentType === "news" ? "news" : "cases"}/${item.slug}`, status: 200 })),
  ...WITHDRAWN_CONTENT.map((path) => ({ path, status: 410 })),
  ...CONTENT_REDIRECTS.map(({ from, to }) => ({ path: from, status: 308, to })),
].sort((a, b) => a.path.localeCompare(b.path, "en"));
const sourceDigest = createHash("sha256").update(source).digest("hex");
await mkdir(".next", { recursive: true });
await writeFile(".next/static-content-manifest.json", JSON.stringify({ schemaVersion: 1, sourceDigest, routes }, null, 2) + "\n");
console.log(`Static content release manifest: ${routes.length} public/withdrawn/redirect paths.`);
