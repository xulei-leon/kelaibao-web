import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export interface InquiryGuardOptions {
  clientIpHeader: string;
  rateKeySecret: string;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  dedupeTtlMs: number;
  maxEntries: number;
  now: () => number;
}

export type InquiryGuardResult =
  | { status: "allowed" }
  | { status: "duplicate" }
  | { status: "rate_limited"; retryAfterSeconds: number };

export class InquiryGuard {
  readonly #options: InquiryGuardOptions;
  readonly #rateBuckets = new Map<string, number[]>();
  readonly #dedupeEntries = new Map<string, number>();

  constructor(options: InquiryGuardOptions) {
    this.#options = options;
  }

  #hash(value: string) {
    return createHmac("sha256", this.#options.rateKeySecret)
      .update(value)
      .digest("hex");
  }

  #clientKey(request: Request) {
    const candidate = request.headers
      .get(this.#options.clientIpHeader)
      ?.split(",", 1)[0]
      ?.trim();
    const normalized =
      candidate && candidate.length <= 64 && isIP(candidate)
        ? candidate
        : "unknown-client";
    return this.#hash(`client:${normalized}`);
  }

  #evictOldest<T>(map: Map<string, T>) {
    while (map.size >= this.#options.maxEntries) {
      const oldest = map.keys().next().value as string | undefined;
      if (!oldest) break;
      map.delete(oldest);
    }
  }

  #cleanup(now: number) {
    const rateCutoff = now - this.#options.rateLimitWindowMs;
    for (const [key, timestamps] of this.#rateBuckets) {
      const active = timestamps.filter((timestamp) => timestamp > rateCutoff);
      if (active.length === 0) {
        this.#rateBuckets.delete(key);
      } else {
        this.#rateBuckets.set(key, active);
      }
    }
    for (const [key, expiresAt] of this.#dedupeEntries) {
      if (expiresAt <= now) this.#dedupeEntries.delete(key);
    }
  }

  check(request: Request, idempotencyKey: string): InquiryGuardResult {
    const now = this.#options.now();
    this.#cleanup(now);
    const clientKey = this.#clientKey(request);
    const dedupeKey = this.#hash(`dedupe:${clientKey}:${idempotencyKey}`);
    if (this.#dedupeEntries.has(dedupeKey)) {
      return { status: "duplicate" };
    }

    const timestamps = this.#rateBuckets.get(clientKey) ?? [];
    if (timestamps.length >= this.#options.rateLimitMax) {
      return {
        status: "rate_limited",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(
            (timestamps[0] + this.#options.rateLimitWindowMs - now) / 1_000,
          ),
        ),
      };
    }

    if (!this.#rateBuckets.has(clientKey)) {
      this.#evictOldest(this.#rateBuckets);
    }
    this.#rateBuckets.set(clientKey, [...timestamps, now]);
    this.#evictOldest(this.#dedupeEntries);
    this.#dedupeEntries.set(dedupeKey, now + this.#options.dedupeTtlMs);
    return { status: "allowed" };
  }

  stats() {
    return {
      dedupeEntries: this.#dedupeEntries.size,
      rateEntries: this.#rateBuckets.size,
    };
  }
}
