import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicContentList } from "@/components/public-content-list";
import type { PublicArticle } from "@/content/article-types";

const item: PublicArticle = {
  contentType: "news",
  slug: "market-update",
  title: "市场更新",
  summary: "这是公开摘要。",

    body: [{ type: "paragraph", text: "公开正文" }],
  firstPublishedAt: new Date("2026-07-20T02:00:00.000Z"),
  publishedAt: new Date("2026-07-30T02:00:00.000Z"),
  updatedAt: new Date("2026-07-30T01:59:00.000Z"),
  coverImage: null,
};

describe("M2-04 public content lists", () => {
  it("renders published summaries with semantic headings and stable links", () => {
    const { container } = render(
      <PublicContentList contentType="news" items={[item]} />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "新闻动态",
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByText(
        "查看客来宝、K-Link 产品、媒体服务及数字化展业相关的新闻、方法说明与行业观察",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "市场更新" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "市场更新" })).toHaveAttribute(
      "href",
      "/news/market-update",
    );
    expect(screen.getByText("这是公开摘要。")).toBeInTheDocument();
    expect(container.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-07-20T02:00:00.000Z",
    );
    expect(container.innerHTML).not.toContain("列表不应输出此正文标记");
    expect(container.innerHTML).not.toMatch(/sourceHtml|actorAdminId/);
  });

  it("renders an explicit empty state without manufacturing content", () => {
    render(<PublicContentList contentType="case" items={[]} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "案例",
    );
    expect(screen.getByText("当前没有已公开的案例。")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
