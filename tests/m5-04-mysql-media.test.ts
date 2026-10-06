import { describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("@/server/db/runtime", () => ({ withRuntimeDatabase: (callback: (db: { query: typeof query }) => unknown) => callback({ query }) }));
import { MySqlMediaUploadRepository } from "@/server/media/mysql-repository";

describe("MySQL single confirmed media lookup", () => {
  it("uses parameterized media_assets lookup and handles a missing row", async () => {
    query.mockResolvedValueOnce([[{ id: 12, object_key: "media/1/asset.jpg", mime_type: "image/jpeg", byte_size: 1024, checksum_sha256: "a".repeat(64), width_px: 1200, height_px: 630, public_usage_confirmed_at: null, public_usage_confirmed_by: null, created_by: 1, created_at: new Date() }]]).mockResolvedValueOnce([[]]);
    const repo = new MySqlMediaUploadRepository();
    expect(await repo.findById(12)).toMatchObject({ id: 12, width: 1200, objectKey: "media/1/asset.jpg" });
    expect(query.mock.calls[0][0]).toContain("FROM media_assets WHERE id = ?");
    expect(query.mock.calls[0][1]).toEqual([12]);
    expect(await repo.findById(99)).toBeNull();
  });
});
