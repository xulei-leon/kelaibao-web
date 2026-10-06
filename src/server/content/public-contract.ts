import type { ContentType } from "@/server/content/domain";

export interface PublicContentSnapshot {
  id: number;
  contentItemId: number;
  revisionNumber: number;
  contentType: ContentType;
  slug: string;
  title: string;
  summary: string;
  sanitizedHtml: string;
  sanitizerPolicyVersion: string;
  firstPublishedAt: Date;
  publishedAt: Date;
  updatedAt: Date;
  coverImage: null | {
    url: string;
    width: number;
    height: number;
    alt: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  };
}

export type PublicContentResult =
  | { status: "published"; item: PublicContentSnapshot }
  | { status: "not_found" }
  | { status: "gone" };
