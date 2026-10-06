import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RichTextEditor from "@/components/admin/rich-text-editor";

describe("CMS rich text source preservation", () => {
  it("does not rewrite HTML on load or mode switching without edits", async () => {
    const change = vi.fn();
    render(<RichTextEditor value={'<p>正文 &amp; 新闻</p>'} onChange={change} approvedImages={[]} disabled={false} />);
    await screen.findByRole("textbox", { name: "正文" });
    fireEvent.click(screen.getByRole("button", { name: "HTML 高级模式" }));
    expect(screen.getByLabelText("HTML 正文")).toHaveValue("<p>正文 &amp; 新闻</p>");
    fireEvent.click(screen.getByRole("button", { name: "可视化编辑" }));
    expect(change).not.toHaveBeenCalled();
  });
  it("preserves legacy tables and never renders an unapproved image from raw source", async () => {
    const html = '<table><tbody><tr><td>保留</td></tr></tbody></table><img src="https://evil.test/track"><script>evil()</script>';
    const change = vi.fn();
    const { container } = render(<RichTextEditor value={html} onChange={change} approvedImages={[]} disabled={false} />);
    await waitFor(() => expect(screen.getByLabelText("HTML 正文")).toHaveValue(html));
    expect(container.querySelector("img, script, table")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "可视化编辑" }));
    expect(screen.getByLabelText("HTML 正文")).toHaveValue(html);
    expect(change).not.toHaveBeenCalled();
  });
});
