import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentEditor } from "@/components/admin/content-editor";
import { StrictMode } from "react";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
let item: Record<string, unknown>;
let token: string;
let authenticated: boolean;
let saveFails: boolean;
let fetcher: ReturnType<typeof vi.fn>;

describe("CMS editing and session recovery", () => {
  beforeEach(() => {
    router.replace.mockReset();
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

  it.each(["news", "case"] as const)("previews and creates %s without entering or submitting a slug", async contentType => {
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation(async (url, init) => {
      if (url === "/api/admin/security/sanitize") return json({ html: "<p>自动链接正文</p>" });
      if (url === "/api/admin/content" && init?.method === "POST") {
        return json({ item: { ...JSON.parse(String(init.body)), id: 2, slug: `${contentType}-0123456789abcdef` } }, 201);
      }
      return original(url, init);
    });
    render(<ContentEditor contentType={contentType} />);
    expect(screen.queryByLabelText(/Slug/)).not.toBeInTheDocument();
    expect(screen.getByText("链接将在保存草稿后自动生成")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/标题/), { target: { value: "中文标题" } });
    fireEvent.change(screen.getByLabelText(/摘要/), { target: { value: "中文摘要" } });
    fireEvent.change(screen.getByLabelText("HTML 正文"), { target: { value: "<p>自动链接正文</p>" } });
    fireEvent.click(screen.getByRole("button", { name: "安全预览" }));
    await screen.findByText("预览已通过安全校验。");
    fireEvent.click(screen.getByRole("button", { name: "创建草稿" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(`/admin/${contentType === "news" ? "news" : "cases"}/2`));
    const create = fetcher.mock.calls.find(([url, init]) => url === "/api/admin/content" && init?.method === "POST");
    expect(JSON.parse(String(create?.[1]?.body))).toMatchObject({ title: "中文标题", contentType });
    expect(JSON.parse(String(create?.[1]?.body))).not.toHaveProperty("slug");
  });

  it("shows the stored path read-only and saves title changes without submitting a slug", async () => {
    render(<ContentEditor contentType="news" itemId={1} />);
    await screen.findByText("/news/original");
    expect(screen.queryByLabelText(/Slug/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布" })).toBeEnabled();
    fireEvent.change(screen.getByLabelText(/标题/), { target: { value: "改标题保留原链接" } });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await screen.findByText("草稿已保存；当前公开版本未改变。");
    const save = fetcher.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(JSON.parse(String(save?.[1]?.body))).not.toHaveProperty("slug");
    expect(screen.getByText("/news/original")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布" })).toBeEnabled();
  });

  it("loads and saves legacy HTML verbatim without creating active markup in the editor", async () => {
    const source = '<table><tr><td>保留 &amp; 原稿</td></tr></table><img src="https://outside.test/track"><script>window.rawHtmlExecuted = true</script>';
    item.sourceHtml = source;
    item.sanitizedHtml = "<p>服务器公开版本</p>";
    const { container } = render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText("HTML 正文")).toHaveValue(source));
    expect(container.querySelector("img, script, table")).toBeNull();
    expect(screen.getByLabelText("HTML 正文").tagName).toBe("TEXTAREA");
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await screen.findByText("草稿已保存；当前公开版本未改变。");
    const save = fetcher.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(JSON.parse(String(save?.[1]?.body)).sourceHtml).toBe(source);
    expect(screen.getByLabelText("HTML 正文")).toHaveValue(source);
  });

  it("previews only the server-sanitized HTML while preserving the entered source", async () => {
    const source = '<p>预览正文</p><script>window.rawHtmlExecuted = true</script>';
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation(async (url, init) => url === "/api/admin/security/sanitize"
      ? json({ html: "<p>预览正文</p>", diagnostics: { changed: true } }) : original(url, init));
    const { container } = render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText("HTML 正文")).toHaveValue("<p>原稿</p>"));
    fireEvent.change(screen.getByLabelText("HTML 正文"), { target: { value: source } });
    fireEvent.click(screen.getByRole("button", { name: "安全预览" }));
    await screen.findByText("预览已移除不允许的内容，原始输入仍保留。");
    expect(screen.getByLabelText("HTML 正文")).toHaveValue(source);
    expect(container.querySelector("script")).toBeNull();
    const preview = container.querySelector("iframe");
    expect(preview).toHaveAttribute("sandbox", "");
    expect(preview?.getAttribute("srcdoc")).toContain("<p>预览正文</p>");
    expect(preview?.getAttribute("srcdoc")).not.toContain("rawHtmlExecuted");
  });

  it("requires saving edits before publishing and preserves the entered body on conflict", async () => {
    render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toHaveValue("原新闻"));
    fireEvent.change(screen.getByLabelText("HTML 正文"), { target: { value: "<p>未保存的新稿</p>" } });
    expect(screen.getByRole("button", { name: "发布" })).toBeDisabled();
    saveFails = true;
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await screen.findByText("服务器版本冲突");
    expect(screen.getByLabelText("HTML 正文")).toHaveValue("<p>未保存的新稿</p>");
    expect(screen.getByRole("button", { name: "重新载入服务器版本" })).toBeInTheDocument();
  });

  it("keeps the draft through expired session and saves with fresh CSRF after reconnect", async () => {
    render(<ContentEditor contentType="news" itemId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/标题/)).toHaveValue("原新闻"));
    fireEvent.change(screen.getByLabelText("HTML 正文"), { target: { value: "<p>重连后保留</p>" } });
    authenticated = false;
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await screen.findByText(/会话不可用，请保留本页/);
    expect(screen.getByRole("link", { name: "在新标签页登录" })).toHaveAttribute("target", "_blank");
    authenticated = true; token = "replacement-csrf";
    fireEvent.click(screen.getByRole("button", { name: "重新连接会话" }));
    await screen.findByText(/会话已重新连接/);
    expect(screen.getByLabelText("HTML 正文")).toHaveValue("<p>重连后保留</p>");
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
    fireEvent.change(screen.getByLabelText("HTML 正文"), { target: { value: "<p>不被历史读取锁住</p>" } });
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole("button", { name: "查看版本历史" }));
      expect(screen.getByLabelText("HTML 正文")).toBeEnabled();
      expect(screen.getByRole("button", { name: "保存草稿" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "重新连接会话" })).toBeEnabled();
      await act(async () => { await vi.advanceTimersByTimeAsync(15001); });
      expect(screen.getByText(/版本历史暂不可用/)).toBeInTheDocument();
      expect(screen.getByLabelText("HTML 正文")).toHaveValue("<p>不被历史读取锁住</p>");
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
    expect(screen.getByLabelText("HTML 正文")).toBeDisabled();
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
