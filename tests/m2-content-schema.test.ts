import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "migrations", "003_content_publication.sql"),
  "utf8",
).replace(/\s+/g, " ");

describe("M2-03 content publication schema", () => {
  it("adds explicit draft/public snapshot and authorization pointers", () => {
    expect(sql).toContain(
      "ADD COLUMN draft_revision_id BIGINT UNSIGNED NULL",
    );
    expect(sql).toContain(
      "ADD COLUMN published_revision_id BIGINT UNSIGNED NULL",
    );
    expect(sql).toContain(
      "ADD COLUMN case_authorization_revision_id BIGINT UNSIGNED NULL",
    );
    expect(sql).toContain("ADD COLUMN slug VARCHAR(191) NULL");
    expect(sql).toContain("fk_content_items_draft_revision");
    expect(sql).toContain("fk_content_items_published_revision");
    expect(sql).toContain("fk_content_items_case_authorization_revision");
  });

  it("creates a bounded cache purge outbox without destructive DDL", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS cache_purge_jobs");
    for (const field of [
      "idempotency_key",
      "content_item_id",
      "content_revision_id",
      "urls_json",
      "status",
      "attempt_count",
      "next_attempt_at",
      "last_error_code",
    ]) {
      expect(sql).toMatch(new RegExp(`\\b${field}\\b`));
    }
    expect(sql).not.toMatch(/\b(DROP|RENAME)\b/i);
  });
});
