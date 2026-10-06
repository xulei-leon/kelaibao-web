import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

describe("M2-02 expand-only security schema", () => {
  const sql = readFileSync(
    join(projectRoot, "migrations", "002_security_foundation.sql"),
    "utf8",
  ).replace(/\s+/g, " ");

  it("enforces the singleton admin, disable, and CSRF session contracts", () => {
    expect(sql).toContain("ADD COLUMN singleton_key TINYINT UNSIGNED");
    expect(sql).toContain("UNIQUE KEY uq_admins_singleton (singleton_key)");
    expect(sql).toContain(
      "CONSTRAINT chk_admins_singleton CHECK (singleton_key = 1)",
    );
    expect(sql).toContain("ADD COLUMN disabled_at DATETIME(6) NULL");
    expect(sql).toContain("ADD COLUMN csrf_token_hash BINARY(32) NULL");
    expect(sql).toContain("confirmation_token_hash BINARY(32) NULL");
    expect(sql).toContain("confirmation_expires_at DATETIME(6) NULL");
  });

  it("versions sanitizer output and creates a single-use upload intent", () => {
    expect(sql).toContain(
      "ADD COLUMN sanitizer_policy_version VARCHAR(64) NOT NULL DEFAULT 'm2-legacy-unversioned'",
    );
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS media_upload_intents",
    );
    for (const field of [
      "admin_id",
      "object_key",
      "mime_type",
      "max_byte_size",
      "expected_sha256",
      "nonce_hash",
      "expires_at",
      "consumed_at",
      "media_asset_id",
    ]) {
      expect(sql).toMatch(new RegExp(`\\b${field}\\b`));
    }
    expect(sql).not.toMatch(/\b(DROP|RENAME)\b/i);
  });
});
