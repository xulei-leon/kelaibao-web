import sanitizeHtml from "sanitize-html";

export const SANITIZER_POLICY_VERSION = "saino-html-2026-07-v1";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "blockquote",
  "a",
  "img",
  "br",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
] as const;

function diagnosticCodes(source: string) {
  const codes = new Set<string>();
  if (/<\s*(script|iframe|form|svg|object|embed|style)\b/i.test(source)) {
    codes.add("blocked_element");
  }
  if (/\son[a-z]+\s*=/i.test(source)) codes.add("blocked_event_attribute");
  if (/(javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(source)) {
    codes.add("blocked_url_scheme");
  }
  if (/\sstyle\s*=/i.test(source)) codes.add("blocked_style");
  return [...codes];
}

export interface SanitizedHtml {
  html: string;
  policyVersion: typeof SANITIZER_POLICY_VERSION;
  diagnostics: {
    changed: boolean;
    codes: string[];
  };
}

function configuredImageOrigins() {
  const value = process.env.OSS_ASSETS_BASE_URL?.trim();
  if (!value) return [];
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? [url.origin] : [];
  } catch {
    return [];
  }
}

export function sanitizeAdminHtml(
  source: string,
  {
    allowedImageOrigins = configuredImageOrigins(),
  }: { allowedImageOrigins?: string[] } = {},
): SanitizedHtml {
  const html = sanitizeHtml(source, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      th: ["scope"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: {
      img: ["https"],
      a: ["https", "mailto"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedStyles: {},
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
    exclusiveFilter(frame) {
      if (frame.tag !== "img") return false;
      const sourceUrl = frame.attribs.src;
      if (!sourceUrl) return true;
      try {
        const url = new URL(sourceUrl);
        return (
          url.protocol !== "https:" ||
          !allowedImageOrigins.includes(url.origin)
        );
      } catch {
        return true;
      }
    },
    nonTextTags: ["script", "style", "textarea", "option", "noscript"],
  }).trim();

  return {
    html,
    policyVersion: SANITIZER_POLICY_VERSION,
    diagnostics: {
      changed: html !== source.trim(),
      codes: diagnosticCodes(source),
    },
  };
}

export function assertPublishableHtml(result: SanitizedHtml) {
  const visibleText = sanitizeHtml(result.html, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
  if (!visibleText && !/<img\b/i.test(result.html)) {
    throw new Error("Sanitized HTML has no publishable content.");
  }
}
