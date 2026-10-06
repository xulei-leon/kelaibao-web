export type AnonymousEventName =
  | "page_view"
  | "open_media_wechat_contact"
  | "open_mini_program_trial";

export interface AnonymousEvent {
  event: AnonymousEventName;
  source: string;
}

const SAFE_SOURCE_TOKEN = /^[a-z0-9][a-z0-9_-]*$/i;
const SAFE_SOURCE_PATH = /^\/(?:[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*)?$/i;
const CONTACT_NUMBER_PATTERN = /\d{7,}/;

export function sanitizeAnonymousEventSource(input: string) {
  const candidate = input.trim().split(/[?#]/, 1)[0];
  if (!candidate || candidate.length > 120 || CONTACT_NUMBER_PATTERN.test(candidate)) {
    return "unknown";
  }
  if (SAFE_SOURCE_PATH.test(candidate) || SAFE_SOURCE_TOKEN.test(candidate)) {
    return candidate;
  }

  const separator = candidate.indexOf(":");
  if (separator <= 0 || candidate.indexOf(":", separator + 1) !== -1) {
    return "unknown";
  }
  const context = candidate.slice(0, separator);
  const location = candidate.slice(separator + 1);
  if (
    SAFE_SOURCE_TOKEN.test(context) &&
    (SAFE_SOURCE_PATH.test(location) || SAFE_SOURCE_TOKEN.test(location))
  ) {
    return `${context}:${location}`;
  }
  return "unknown";
}

function getAnalyticsEndpoint() {
  const candidate = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT?.trim();
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return /^https?:$/.test(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function trackAnonymousEvent(payload: AnonymousEvent) {
  if (typeof window === "undefined") return;
  const endpoint = getAnalyticsEndpoint();
  if (!endpoint) return;

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: payload.event,
      source: sanitizeAnonymousEventSource(payload.source),
    }),
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}
