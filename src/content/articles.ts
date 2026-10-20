import type { ArticleSource, ContentRedirect } from "./article-types";

// Add only reviewed public material. See docs/2-Design/Static-News-and-Cases-Spec.md.
// An empty local catalogue does NOT certify that the previous live CMS was empty.
export const ARTICLES: readonly ArticleSource[] = [];

// Exact original paths of previously public articles that have been withdrawn.
export const WITHDRAWN_CONTENT: readonly string[] = [];

// Exact original paths -> current public article paths. No external redirects.
export const CONTENT_REDIRECTS: readonly ContentRedirect[] = [];
