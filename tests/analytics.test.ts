import { afterEach, describe, expect, it, vi } from "vitest";
import { trackAnonymousEvent, type AnonymousEvent } from "@/lib/analytics";

describe("anonymous analytics", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    vi.unstubAllGlobals();
  });

  it("posts only the anonymous event name and source", async () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "https://analytics.example.test/events";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    trackAnonymousEvent({
      event: "page_view",
      source: "/about",
      personalData: "must-not-leave-browser",
    } as AnonymousEvent & { personalData: string });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(request.body as string)).toEqual({
      event: "page_view",
      source: "/about",
    });
  });
});
