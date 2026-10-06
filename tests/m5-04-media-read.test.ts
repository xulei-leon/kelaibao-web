import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn() }));
vi.mock("@/server/auth/request", () => ({ authenticateAdminSession: mocks.session }));
vi.mock("@/server/db/repository-factory", () => ({
  createMediaUploadRepository: () => ({ findById: mocks.find }),
}));
import { GET } from "@/app/api/admin/media/[id]/route";
import { mediaApiError } from "@/server/media/admin-api";

describe("CMS confirmed media lookup", () => {
  beforeEach(() => {
    mocks.session.mockResolvedValue({ adminId: 1 });
    mocks.find.mockResolvedValue({ id: 8, objectKey: "media/1/confirmed.jpg", mimeType: "image/jpeg", width: 1200, height: 630, byteSize: 4096, publicUsageConfirmedAt: null, checksumSha256: "private", createdBy: 1 });
    vi.stubEnv("OSS_ASSETS_BASE_URL", "https://assets.example.test");
  });
  it("returns only display fields without requiring STS, and never caches", async () => {
    const result = await GET(new Request("https://site.test/api/admin/media/8"), { params: Promise.resolve({ id: "8" }) });
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect((await result.json()).asset).toEqual({ id: 8, publicUrl: "https://assets.example.test/media/1/confirmed.jpg", mimeType: "image/jpeg", width: 1200, height: 630, byteSize: 4096, publicUsageConfirmedAt: null });
  });
  it("rejects anonymous reads before touching media", async () => {
    mocks.session.mockResolvedValue(null);
    const result = await GET(new Request("https://site.test/api/admin/media/8"), { params: Promise.resolve({ id: "8" }) });
    expect(result.status).toBe(401);
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("returns 404 for missing or invalid media", async () => {
    mocks.find.mockResolvedValue(null);
    const result = await GET(new Request("https://site.test/api/admin/media/8"), { params: Promise.resolve({ id: "8" }) });
    expect(result.status).toBe(404);
  });
  it("distinguishes processing, authentication and permanent rejection", () => {
    expect(mediaApiError(new Error("Upload intent confirmation is already in progress."))).toMatchObject({ status: 409, code: "confirmation_in_progress", retryable: true });
    expect(mediaApiError(new Error("Administrator authentication required."))).toMatchObject({ status: 401, retryable: false });
    expect(mediaApiError(new Error("Image SHA-256 does not match."))).toMatchObject({ status: 422, retryable: false });
  });
});
