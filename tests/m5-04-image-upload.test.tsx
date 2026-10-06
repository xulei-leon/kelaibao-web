import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ upload: vi.fn(), confirm: vi.fn(), dimensions: vi.fn() }));
vi.mock("@/lib/admin/media-upload", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/admin/media-upload")>(),
  uploadImage: mocks.upload, confirmUploadedImage: mocks.confirm, imageDimensions: mocks.dimensions,
}));
import { ImageUpload } from "@/components/admin/image-upload";
import { MediaUploadError } from "@/lib/admin/media-upload";

const asset = { id: 7, publicUrl: "https://assets.test/media/1/a.png", mimeType: "image/png", byteSize: 512, width: 1200, height: 630, publicUsageConfirmedAt: null };
describe("CMS image picker", () => {
  beforeEach(() => { mocks.upload.mockResolvedValue(asset); mocks.confirm.mockResolvedValue(asset); mocks.dimensions.mockResolvedValue({ width: 1200, height: 630 }); });
  function choose(purpose: "body" | "cover") {
    fireEvent.change(screen.getByLabelText(purpose === "cover" ? "封面图片" : "正文图片"), { target: { files: [new File(["image"], "photo.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByLabelText(purpose === "cover" ? "封面图片说明" : "正文图片说明"), { target: { value: "新闻配图" } });
  }
  it("only inserts the confirmed image with alt text", async () => {
    const inserted = vi.fn();
    render(<ImageUpload purpose="body" disabled={false} csrf={async () => "csrf"} onBusy={vi.fn()} onUploaded={inserted} />);
    choose("body"); fireEvent.click(screen.getByRole("button", { name: "上传并插入正文" }));
    await waitFor(() => expect(inserted).toHaveBeenCalledWith(asset, "新闻配图"));
    expect(screen.getByLabelText("正文图片说明")).toHaveValue("");
  });
  it("checks cover dimensions before any presign/upload call", async () => {
    mocks.dimensions.mockResolvedValue({ width: 200, height: 200 });
    const inserted = vi.fn();
    render(<ImageUpload purpose="cover" disabled={false} csrf={async () => "csrf"} onBusy={vi.fn()} onUploaded={inserted} />);
    choose("cover"); fireEvent.click(screen.getByRole("button", { name: "上传封面" }));
    await screen.findByText(/封面至少为/);
    expect(mocks.upload).not.toHaveBeenCalled(); expect(inserted).not.toHaveBeenCalled();
  });
  it("retains alt and intent after an uncertain response, then confirms without uploading again", async () => {
    mocks.upload.mockRejectedValue(new MediaUploadError("仍在处理中", true, "existing-intent"));
    const inserted = vi.fn();
    const pending = vi.fn();
    render(<ImageUpload purpose="body" disabled={false} csrf={async () => "csrf"} onBusy={vi.fn()} onUploaded={inserted} onPendingChange={pending} />);
    choose("body"); fireEvent.click(screen.getByRole("button", { name: "上传并插入正文" }));
    const retry = await screen.findByRole("button", { name: "重试确认" });
    expect(screen.getByLabelText("正文图片说明")).toHaveValue("新闻配图");
    expect(inserted).not.toHaveBeenCalled();
    expect(pending).toHaveBeenLastCalledWith(true);
    fireEvent.click(retry);
    await waitFor(() => expect(inserted).toHaveBeenCalledWith(asset, "新闻配图"));
    expect(mocks.confirm.mock.calls[0][0]).toBe("existing-intent"); expect(mocks.upload).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(pending).toHaveBeenLastCalledWith(false));
  });
});
