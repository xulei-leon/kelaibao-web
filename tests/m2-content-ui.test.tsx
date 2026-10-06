import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContentEditor } from "@/components/admin/content-editor";

vi.mock("next/dynamic", () => ({ default: () => () => <div role="textbox" aria-label="正文" /> }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("M2-03 content administration UI", () => {
  it("renders the server-owned new-case form with preview and authorization guidance", () => {
    render(<ContentEditor contentType="case" />);

    expect(
      screen.getByRole("heading", { name: "新建案例" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/标题/)).toBeRequired();
    expect(screen.getByLabelText(/摘要/)).toBeRequired();
    expect(screen.getByLabelText(/Slug/)).toBeRequired();
    expect(screen.getByRole("textbox", { name: "正文" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "安全预览" }),
    ).toBeInTheDocument();
  });

  it("provides every confirmed page and preserves conflict/validation recovery controls", () => {
    const root = process.cwd();
    const editor = readFileSync(
      join(root, "src/components/admin/content-editor.tsx"),
      "utf8",
    );
    for (const path of [
      "src/app/admin/(protected)/news/page.tsx",
      "src/app/admin/(protected)/news/new/page.tsx",
      "src/app/admin/(protected)/news/[id]/page.tsx",
      "src/app/admin/(protected)/cases/page.tsx",
      "src/app/admin/(protected)/cases/new/page.tsx",
      "src/app/admin/(protected)/cases/[id]/page.tsx",
    ]) {
      expect(() => readFileSync(join(root, path), "utf8"), path).not.toThrow();
    }
    expect(editor).toContain('result.code === "version_conflict"');
    expect(editor).toContain("重新载入服务器版本");
    expect(editor).toContain("document.getElementById");
    expect(editor).toContain("表单内容已保留");
    expect(editor).toContain("min-w-0");
    expect(editor).not.toContain("products/sino-en/src");
  });
});
