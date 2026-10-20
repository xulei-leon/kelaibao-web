export type ContentType = "news" | "case";

export interface ArticleImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

// Text is rendered by React, never interpreted as HTML or executable markup.
export type ArticleBlock =
  | { type: "paragraph" | "heading" | "quote"; text: string }
  | { type: "list"; items: readonly string[] }
  | { type: "image"; image: ArticleImage };

export interface ArticleSource {
  contentType: ContentType;
  slug: string;
  title: string;
  summary: string;
  firstPublishedAt: string;
  publishedAt: string;
  updatedAt: string;
  body: readonly ArticleBlock[];
  coverImage: ArticleImage | null;
  // Public approval date only. Private evidence belongs outside public modules.
  authorizationReviewedAt?: string;
}

export interface PublicArticle extends Omit<ArticleSource,
  "firstPublishedAt" | "publishedAt" | "updatedAt" | "authorizationReviewedAt"> {
  firstPublishedAt: Date;
  publishedAt: Date;
  updatedAt: Date;
}

export interface ContentRedirect {
  from: string;
  to: string;
}
