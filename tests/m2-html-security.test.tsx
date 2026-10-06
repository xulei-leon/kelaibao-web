import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SafeHtmlPreview } from "@/components/admin/safe-html-preview";
import {
  SANITIZER_POLICY_VERSION,
  sanitizeAdminHtml,
} from "@/server/security/html/sanitizer";

describe("M2-02 HTML safety", () => {
  it.each([
    ["script", "<p>ok</p><script>alert(1)</script>", /<script/i],
    ["event", '<img src="https://assets.example/a.png" onerror="alert(1)">', /onerror/i],
    ["iframe", '<iframe src="https://evil.example"></iframe>', /iframe/i],
    ["form", '<form action="https://evil.example"><input></form>', /form/i],
    ["svg", '<svg><script>alert(1)</script></svg>', /svg/i],
    ["javascript URL", '<a href="javascript:alert(1)">click</a>', /javascript:/i],
    ["style", '<p style="background:url(javascript:alert(1))">x</p>', /style=/i],
    ["data image", '<img src="data:image/svg+xml,<svg onload=alert(1)>">', /data:/i],
  ])("removes the %s attack vector", (_name, source, forbidden) => {
    const result = sanitizeAdminHtml(source);

    expect(result.policyVersion).toBe(SANITIZER_POLICY_VERSION);
    expect(result.html).not.toMatch(forbidden);
    expect(result.diagnostics.changed).toBe(true);
    expect(JSON.stringify(result.diagnostics)).not.toContain(source);
  });

  it("keeps a versioned allowlist and safe HTTPS content", () => {
    const result = sanitizeAdminHtml(
      '<h2>标题</h2><p><strong>正文</strong> <a href="https://example.cn/a">链接</a></p>',
    );

    expect(result.html).toContain("<h2>标题</h2>");
    expect(result.html).toContain('href="https://example.cn/a"');
    expect(result.html).toContain('rel="noopener noreferrer"');
  });

  it("renders preview with a restrictive CSP and no elevated sandbox tokens", () => {
    render(<SafeHtmlPreview html="<p>安全预览</p>" />);

    const frame = screen.getByTitle("净化后的内容预览");
    expect(frame).toHaveAttribute("sandbox", "");
    expect(frame).not.toHaveAttribute("allow");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(frame.getAttribute("srcdoc")).toContain(
      "default-src 'none'; img-src https:; style-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    expect(frame.getAttribute("srcdoc")).toContain("<p>安全预览</p>");
  });
});
