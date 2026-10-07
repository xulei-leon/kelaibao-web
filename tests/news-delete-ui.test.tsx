import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentList } from "@/components/admin/content-list";
const item = { id: 12, title: "删除交互新闻", slug: "test-news", publicStatus: "draft", version: 3, draftRevisionId: 1, publishedRevisionId: null };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
let fetcher: ReturnType<typeof vi.fn>;
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
beforeEach(() => {
  fetcher = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("?type=")) return json({ items: [item] });
    if (url.endsWith("/session")) return json({ csrfToken: "fresh-csrf" });
    if (init?.method === "DELETE") return json({ ok: true });
    throw new Error("unexpected request");
  });
  vi.stubGlobal("fetch", fetcher);
});
describe("news list delete control", () => {
  it("confirms deletion, sends current version and fresh CSRF, then removes the row", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ContentList contentType="news" />);
    const button = await screen.findByRole("button", { name: "删除新闻：删除交互新闻" });
    expect(screen.getByRole("link", { name: "编辑" }).parentElement).toBe(button.parentElement);
    fireEvent.click(button);
    await screen.findByText("新闻已删除。");
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining(item.title));
    expect(screen.queryByText(item.title)).not.toBeInTheDocument();
    expect(fetcher.mock.calls.find(([, init]) => init?.method === "DELETE")?.[1]).toMatchObject({ headers: { "X-CSRF-Token": "fresh-csrf" }, body: JSON.stringify({ expectedVersion: 3 }) });
  });
  it("does not send a mutation after cancelling", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ContentList contentType="news" />);
    fireEvent.click(await screen.findByRole("button", { name: /删除新闻/ }));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(screen.getByText(item.title)).toBeInTheDocument();
  });
  it("keeps the row and allows retry after a version conflict", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation((url, init) => init?.method === "DELETE" ? Promise.resolve(json({ code: "version_conflict" }, 409)) : original(url, init));
    render(<ContentList contentType="news" />);
    const button = await screen.findByRole("button", { name: /删除新闻/ });
    fireEvent.click(button);
    await screen.findByText("新闻已被修改，请刷新列表后再删除。");
    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
  it("blocks duplicate clicks while a delete is pending", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation((url, init) => init?.method === "DELETE" ? new Promise(() => {}) : original(url, init));
    render(<ContentList contentType="news" />);
    const button = await screen.findByRole("button", { name: /删除新闻/ });
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.click(button);
    await waitFor(() => expect(fetcher.mock.calls.filter(([, init]) => init?.method === "DELETE")).toHaveLength(1));
  });
  it("does not add deletion to the cases list", async () => {
    render(<ContentList contentType="case" />);
    await screen.findByText(item.title);
    expect(screen.queryByRole("button", { name: /删除/ })).not.toBeInTheDocument();
  });
});
