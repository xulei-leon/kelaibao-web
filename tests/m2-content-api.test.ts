import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  contentApiError,
  parseContentType,
  readContentJson,
} from "@/server/content/admin-api";
import { describe, expect, it } from "vitest";

describe("M2-03 administrator content API", () => {
  it("accepts only the two server-owned CMS content types", () => {
    expect(parseContentType("news")).toBe("news");
    expect(parseContentType("case")).toBe("case");
    expect(() => parseContentType("page")).toThrow(/news or case/i);
  });

  it("rejects malformed or oversized JSON before content processing", async () => {
    await expect(
      readContentJson(
        new Request("https://www.example.cn/api/admin/content", {
          method: "POST",
          body: "{invalid",
        }),
      ),
    ).rejects.toThrow(/valid JSON/i);
    await expect(
      readContentJson(
        new Request("https://www.example.cn/api/admin/content", {
          method: "POST",
          headers: { "Content-Length": "3000000" },
          body: "{}",
        }),
      ),
    ).rejects.toThrow(/too large/i);
  });

  it.each([
    ["duplicate_slug", 409, "duplicate_slug"],
    ["content_version_conflict", 409, "version_conflict"],
    ["Invalid content transition for offline.", 409, "invalid_transition"],
    [
      "Case authorization confirmation is required.",
      422,
      "authorization_required",
    ],
    ["content_not_found", 404, "not_found"],
    ["Title must contain between 1 and 160 characters.", 400, "validation_error"],
  ])(
    "maps %s to a stable response",
    (message, status, code) => {
      expect(contentApiError(new Error(String(message)))).toMatchObject({
        status,
        code,
      });
    },
  );

  it("provides every confirmed route and keeps mutation controls centralized", () => {
    const root = process.cwd();
    const routePaths = [
      "src/app/api/admin/content/route.ts",
      "src/app/api/admin/content/[id]/route.ts",
      "src/app/api/admin/content/[id]/publish/route.ts",
      "src/app/api/admin/content/[id]/offline/route.ts",
      "src/app/api/admin/content/[id]/revisions/route.ts",
    ];
    for (const path of routePaths) {
      expect(existsSync(join(root, path)), path).toBe(true);
    }

    for (const path of routePaths.slice(0, 4)) {
      const source = readFileSync(join(root, path), "utf8");
      expect(source).toContain("requireAdminMutation");
      expect(source).not.toMatch(/webservice/i);
    }
    const combined = routePaths
      .map((path) => readFileSync(join(root, path), "utf8"))
      .join("\n");
    expect(combined).toContain("parseExpectedVersion");
    expect(combined).toContain("attemptPostCommitPurge");
    expect(combined).toMatch(
      /attemptPostCommitPurge\(\s*result\.purgeJobId/,
    );
    expect(combined).not.toContain("products/sino-en/src");
  });
});
