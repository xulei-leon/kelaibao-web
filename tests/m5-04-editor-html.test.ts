import { describe, expect, it } from "vitest";
import { equivalentEditorHtml, htmlImageSources, safeEditorLink, safeVisualHtml } from "@/lib/admin/editor-html";

describe("CMS visual import guard", () => {
  it("accepts the supported subset but leaves legacy tables and attributes in source mode", () => {
    expect(safeVisualHtml('<h2>新闻</h2><p><strong>正文</strong></p>', [])).toBe(true);
    expect(safeVisualHtml('<table><tbody><tr><td>旧内容</td></tr></tbody></table>', [])).toBe(false);
    expect(safeVisualHtml('<p style="color:red">旧格式</p>', [])).toBe(false);
    expect(equivalentEditorHtml('<p> a  b </p>', '<p>a b</p>')).toBe(false);
  });
  it.each(['<script>alert(1)</script>', '<p onclick="alert(1)">内容</p>', '<img src="https://outside.test/a.jpg">', '<a href="javascript:alert(1)">link</a>', '<svg onload="alert(1)"></svg>'])('never promotes unsafe source to active DOM: %s', html => {
    expect(safeVisualHtml(html, [])).toBe(false);
  });
  it("only allows images explicitly acknowledged by the server", () => {
    const html = '<img src="https://assets.test/media/1/a.jpg" alt="示意图" width="1200" height="630">';
    expect(safeVisualHtml(html, [])).toBe(false);
    expect(safeVisualHtml(html, htmlImageSources(html))).toBe(true);
  });
  it.each(["javascript:alert(1)", "//evil.test", "https://user:pass@example.test", "data:text/html,abc", "mailto:a@example.test?body=secret"])('rejects unsafe link %s', href => expect(safeEditorLink(href)).toBe(false));
  it("accepts explicit HTTPS and mailto", () => {
    expect(safeEditorLink("https://example.test/path")).toBe(true);
    expect(safeEditorLink("mailto:info@example.test")).toBe(true);
  });
});
