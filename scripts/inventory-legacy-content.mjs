import mysql from "mysql2/promise";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";

// Explicit read-only operation. No migrations, bootstrap, writes or cloud changes.
const root = resolve(process.cwd(), ".local-data");
const output = resolve(root, "legacy-content-inventory.json");
let connection;
try {
  const url = process.env.DATABASE_URL;
  if (!url || new URL(url).protocol !== "mysql:") throw new Error("mysql_required");
  connection = await mysql.createConnection(url);
  await connection.query("START TRANSACTION READ ONLY");
  const [items] = await connection.query(`SELECT i.id, i.content_type, i.slug, i.status,
    i.first_published_at, i.published_at, i.deleted_at, i.published_revision_id,
    i.case_authorization_confirmed_at, r.title, r.summary, r.sanitized_html,
    r.cover_media_asset_id, r.cover_alt
    FROM content_items i LEFT JOIN content_revisions r ON r.id = i.published_revision_id
    ORDER BY i.content_type, i.slug`);
  await connection.rollback();
  await mkdir(root, { recursive: true });
  const actualRoot = await realpath(root);
  const inside = relative(resolve(process.cwd()), actualRoot);
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) throw new Error("unsafe_output");
  // Exclusive create: never overwrite a previous inventory or follow a file link.
  await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), readOnly: true, items }, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  console.log(`Read-only inventory saved in .local-data (${items.length} rows). Review privately; do not publish this file.`);
} catch {
  console.error("Legacy content inventory failed. Check the read-only MySQL connection, current schema, and a new .local-data output path. Credentials and content are not logged.");
  process.exitCode = 1;
} finally {
  await connection?.end();
}
