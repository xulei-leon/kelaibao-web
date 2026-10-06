import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentEditor } from "@/components/admin/content-editor";
import { StrictMode } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("next/dynamic", () => ({ default: () => (props: { value: string; onChange: (value: string) => void; disabled: boolean }) => <textarea aria-label="正文" value={props.value} disabled={props.disabled} onChange={e => props.onChange(e.target.value)} /> }));

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
let item: Record<string, unknown>;
let token: string;
let authenticated: boolean;
let saveFails: boolean;
let fetcher: ReturnType<typeof vi.fn>;

describe("CMS editing and session recovery", () => {
  beforeEach(() => {
    vi.stubGlobal("navigation", new EventTarget());
    item = { id: 1, contentType: "news", title: "原新闻", summary: "摘要", slug: "original", sourceHtml: "<p>原稿</p>", sanitizedHtml: "<p>原稿</p>", coverMediaAssetId: null, coverAlt: null, version: 1, publicStatus: "draft", draftRevisionId: 1, publishedRevisionId: null, firstPublishedAt: null };
    token = "first-csrf"; authenticated = true; saveFails = false;
    fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/admin/auth/session") return authenticated ? json({ csrfToken: token }) : json({ ok: false }, 401);
      if (url === "/api/admin/content/1" && init?.method === "PUT") {
        if (saveFails) return json({ code: "version_conflict", message: "服务器版本冲突" }, 409);
        item = { ...item, ...JSON.parse(String(init.body)), version: Number(item.version) + 1 };
        return json({ ok: true, item });
      }
      if (url === "/api/admin/content/1") return json({ item, draftRevision: item, publishedRevision: null });
      throw new Error(`unexpected test request ${url}`);
    });
    vi.stubGlobal("fetch", fetcher);
  });

  it("requires saving edits before publishing and preserves the entered body on conflict", async () => {
    render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toHaveValue("原新闻"));
    fireEvent.change(screen.getByLabelText("正文"), { target: { value: "<p>未保存的新稿</p>" } });
    expect(screen.getByRole("button", { name: "发布" })).toBeDisabled();
    saveFails = true;
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await screen.findByText("服务器版本冲突");
    expect(screen.getByLabelText("正文")).toHaveValue("<p>未保存的新稿</p>");
    expect(screen.getByRole("button", { name: "重新载入服务器版本" })).toBeInTheDocument();
  });

  it("keeps the draft through expired session and saves with fresh CSRF after reconnect", async () => {
    render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toHaveValue("原新闻"));
    fireEvent.change(screen.getByLabelText("正文"), { target: { value: "<p>重连后保留</p>" } });
    authenticated = false;
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await screen.findByText(/会话不可用，请保留本页/);
    expect(screen.getByRole("link", { name: "在新标签页登录" })).toHaveAttribute("target", "_blank");
    authenticated = true; token = "replacement-csrf";
    fireEvent.click(screen.getByRole("button", { name: "重新连接会话" }));
    await screen.findByText(/会话已重新连接/);
    expect(screen.getByLabelText("正文")).toHaveValue("<p>重连后保留</p>");
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await screen.findByText("草稿已保存；当前公开版本未改变。");
    const call = fetcher.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(call?.[1]?.headers).toMatchObject({ "X-CSRF-Token": "replacement-csrf" });
    expect(screen.getByRole("button", { name: "发布" })).toBeEnabled();
  });

  it("reloads a saved cover using display metadata, with no media ID input", async () => {
    item.coverMediaAssetId = 8; item.coverAlt = "新闻配图";
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation(async (url, init) => url === "/api/admin/media/8" ? json({ asset: { id: 8, publicUrl: "https://assets.example.test/media/1/cover.jpg", mimeType: "image/jpeg", width: 1200, height: 630, byteSize: 2048, publicUsageConfirmedAt: "2026-09-24" } }) : original(url, init));
    render(<ContentEditor contentType="news" itemId={1} />);
    expect(await screen.findByRole("img", { name: "新闻配图" })).toHaveAttribute("src", "https://assets.example.test/media/1/cover.jpg");
    expect(screen.queryByLabelText("媒体 ID")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "移除封面" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布" })).toBeDisabled();
  });

  it("keeps editing available during a stalled history body and releases the query at its deadline", async () => {
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation(async (url, init) => url.endsWith("/revisions") ? ({
      ok: true,
      json: () => new Promise((_, reject) => init!.signal!.addEventListener("abort", () => reject(new Error("timeout")))),
    } as Response) : original(url, init));
    render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toHaveValue("原新闻"));
    fireEvent.change(screen.getByLabelText("正文"), { target: { value: "<p>不被历史读取锁住</p>" } });
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole("button", { name: "查看版本历史" }));
      expect(screen.getByLabelText("正文")).toBeEnabled();
      expect(screen.getByRole("button", { name: "保存草稿" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "重新连接会话" })).toBeEnabled();
      await act(async () => { await vi.advanceTimersByTimeAsync(15001); });
      expect(screen.getByText(/版本历史暂不可用/)).toBeInTheDocument();
      expect(screen.getByLabelText("正文")).toHaveValue("<p>不被历史读取锁住</p>");
      expect(screen.getByRole("button", { name: "查看版本历史" })).toBeEnabled();
    } finally { vi.useRealTimers(); }
  });

  it("protects pending image selections even when the article itself is saved", async () => {
    render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toHaveValue("原新闻"));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    try {
      fireEvent.change(screen.getByLabelText("正文图片说明"), { target: { value: "尚未插入的图片" } });
      const link = screen.getByRole("link", { name: "返回新闻列表" });
      expect(fireEvent.click(link)).toBe(false);
      expect(confirm).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole("button", { name: "放弃正文图片操作" }));
      expect(screen.queryByText(/有待完成的图片操作/)).not.toBeInTheDocument();
    } finally { confirm.mockRestore(); }
  });
  it("keeps unsupported browsers read-only before a draft can be entered", async () => {
    vi.stubGlobal("navigation", undefined);
    render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toHaveValue("原新闻"));
    expect(screen.getByLabelText("正文")).toBeDisabled();
    expect(screen.getByLabelText(/标题/)).toBeDisabled();
    expect(screen.getByText(/此浏览器无法保护未保存内容/)).toBeInTheDocument();
  });
  it("ignores a late initial response after Strict Mode starts a newer load", async () => {
    let resolveOld!: (response: Response) => void;
    fetcher.mockImplementationOnce(() => new Promise<Response>(resolve => { resolveOld = resolve; }));
    render(<StrictMode><ContentEditor contentType="news" itemId={1} /></StrictMode>);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/标题/), { target: { value: "编辑中的标题" } });
    await act(async () => { resolveOld(json({ item, draftRevision: item, publishedRevision: null })); });
    expect(screen.getByLabelText(/标题/)).toHaveValue("编辑中的标题");
  });
});
