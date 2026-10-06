import { describe, expect, it, vi } from "vitest";
import { confirmUploadedImage, uploadImage } from "@/lib/admin/media-upload";

const asset = { id: 1, publicUrl: "https://assets.test/media/1/image.png", mimeType: "image/png", byteSize: 8, width: 1200, height: 630, publicUsageConfirmedAt: null };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const file = () => ({ name: "test.png", type: "image/png", size: 8, arrayBuffer: async () => new ArrayBuffer(8) }) as File;

describe("CMS browser upload protocol", () => {
  it("signs, PUTs without application credentials, then binds only the confirmed asset", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ ok: true, intentId: "intent-1", authorization: { url: "https://bucket.test/pending/1?signature=hidden", method: "PUT", headers: { "Content-Type": "image/png" }, expiresAt: new Date(Date.now() + 60000).toISOString() } })).mockResolvedValueOnce(new Response(null, { status: 200 })).mockResolvedValueOnce(response({ ok: true, asset }));
    const result = await uploadImage(file(), { csrf: async () => "csrf", fetcher, digest: async () => new ArrayBuffer(32) });
    expect(result).toEqual(asset);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ byteSize: 8, sha256: "0".repeat(64) });
    expect(fetcher.mock.calls[1][1]).toMatchObject({ method: "PUT", credentials: "omit", referrerPolicy: "no-referrer" });
    expect(fetcher.mock.calls[1][1].headers).not.toHaveProperty("X-CSRF-Token");
  });
  it("retries confirmation of the same intent after a lost response", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("network")) .mockResolvedValueOnce(response({ ok: true, asset }));
    expect(await confirmUploadedImage("same-intent", { csrf: async () => "new-csrf", fetcher, delay: async () => {} })).toEqual(asset);
    expect(fetcher.mock.calls.map(call => JSON.parse(call[1].body).intentId)).toEqual(["same-intent", "same-intent"]);
  });
  it("does not retry invalid files or permanent confirmation rejection", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ ok: false, code: "media_rejected", retryable: false }, 422));
    await expect(uploadImage({ ...file(), type: "image/svg+xml" } as File, { csrf: async () => "csrf", fetcher })).rejects.toThrow(/JPEG/);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(confirmUploadedImage("intent", { csrf: async () => "csrf", fetcher })).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("retains an unresolved intent for manual confirmation after bounded retries", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ ok: false, code: "confirmation_in_progress", retryable: true }, 409));
    await expect(confirmUploadedImage("intent", { csrf: async () => "csrf", fetcher, delay: async () => {} })).rejects.toMatchObject({ intentId: "intent", retryable: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("honors Retry-After between a lost response, active lease and eventual confirmation", async () => {
    const delay = vi.fn(async () => {});
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("lost"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, code: "confirmation_in_progress" }), { status: 409, headers: { "Retry-After": "7" } }))
      .mockResolvedValueOnce(response({ ok: true, asset }));
    expect(await confirmUploadedImage("same-intent", { csrf: async () => "csrf", fetcher, delay })).toEqual(asset);
    expect(delay.mock.calls).toEqual([[1000], [7000]]);
    expect(fetcher.mock.calls.map(call => JSON.parse(call[1].body).intentId)).toEqual(["same-intent", "same-intent", "same-intent"]);
  });
});
