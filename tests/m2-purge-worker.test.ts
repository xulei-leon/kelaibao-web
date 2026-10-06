import { assertPurgeWorkerRequest } from "@/server/content/purge-worker-auth";
import { describe, expect, it } from "vitest";

const token = "p".repeat(48);
const env = {
  NEXT_PUBLIC_SITE_URL: "https://www.example.cn",
  PURGE_WORKER_TOKEN: token,
};

function request(
  authorization = `Bearer ${token}`,
  url = "https://www.example.cn/api/internal/cache-purge",
) {
  return new Request(url, {
    method: "POST",
    headers: {
      Host: new URL(url).host,
      Authorization: authorization,
    },
  });
}

describe("M2-03 purge worker boundary", () => {
  it("accepts only a constant-time bearer identity on the canonical host", () => {
    expect(() => assertPurgeWorkerRequest(request(), env)).not.toThrow();
    expect(() =>
      assertPurgeWorkerRequest(request(`Bearer ${"x".repeat(48)}`), env),
    ).toThrow(/authentication/i);
    expect(() =>
      assertPurgeWorkerRequest(
        request(`Bearer ${token}`, "https://fc.internal/api/internal/cache-purge"),
        env,
      ),
    ).toThrow(/canonical/i);
  });

  it("keeps the real worker identity and cloud execution evidence deferred", () => {
    expect(() =>
      assertPurgeWorkerRequest(request(), {
        NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
      }),
    ).toThrow(/not configured/i);
  });
});
