import type { InquiryGuardOptions } from "@/server/inquiry/guard";
import type { DirectMailConfig } from "@/server/inquiry/directmail";

type Environment = Record<string, string | undefined>;

function required(env: Environment, name: string) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function integerWithin(
  env: Environment,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

function email(value: string, name: string) {
  if (
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    throw new Error(`${name} must be a valid email address.`);
  }
  return value;
}

export function resolveDirectMailConfig(
  env: Environment = process.env,
): DirectMailConfig {
  const endpointValue = required(env, "DIRECTMAIL_ENDPOINT");
  let endpoint: URL;
  try {
    endpoint = new URL(endpointValue);
  } catch {
    throw new Error("DIRECTMAIL_ENDPOINT must be a valid HTTPS URL.");
  }
  if (endpoint.protocol !== "https:") {
    throw new Error("DIRECTMAIL_ENDPOINT must use HTTPS.");
  }
  if (endpoint.username || endpoint.password) {
    throw new Error("DIRECTMAIL_ENDPOINT must not contain credentials.");
  }
  if (endpoint.search || endpoint.hash || endpoint.pathname !== "/") {
    throw new Error("DIRECTMAIL_ENDPOINT is not an approved endpoint.");
  }
  const runtimeMode = env.SINO_RUNTIME_MODE?.trim() ?? "preview";
  if (
    runtimeMode === "production" &&
    endpoint.hostname.toLowerCase() !== "dm.aliyuncs.com"
  ) {
    throw new Error("DIRECTMAIL_ENDPOINT is not an approved production endpoint.");
  }

  return {
    endpoint,
    accessKeyId: required(env, "DIRECTMAIL_ACCESS_KEY_ID"),
    accessKeySecret: required(env, "DIRECTMAIL_ACCESS_KEY_SECRET"),
    accountName: email(
      required(env, "DIRECTMAIL_ACCOUNT_NAME"),
      "DIRECTMAIL_ACCOUNT_NAME",
    ),
    fromAlias: required(env, "DIRECTMAIL_FROM_ALIAS").slice(0, 30),
    toAddress: email(
      required(env, "DIRECTMAIL_TO_ADDRESS"),
      "DIRECTMAIL_TO_ADDRESS",
    ),
    timeoutMs: integerWithin(
      env,
      "DIRECTMAIL_TIMEOUT_MS",
      5_000,
      500,
      5_000,
    ),
  };
}

export function resolveInquiryGuardConfig(
  env: Environment = process.env,
): Omit<InquiryGuardOptions, "now"> {
  const clientIpHeader =
    env.INQUIRY_CLIENT_IP_HEADER?.trim().toLowerCase() || "x-esa-client-ip";
  if (!/^[a-z0-9-]{1,64}$/.test(clientIpHeader)) {
    throw new Error("INQUIRY_CLIENT_IP_HEADER is invalid.");
  }
  const rateKeySecret = required(env, "INQUIRY_RATE_KEY_SECRET");
  if (rateKeySecret.length < 32) {
    throw new Error("INQUIRY_RATE_KEY_SECRET must contain at least 32 characters.");
  }

  return {
    clientIpHeader,
    rateKeySecret,
    rateLimitMax: integerWithin(env, "INQUIRY_RATE_LIMIT_MAX", 5, 1, 20),
    rateLimitWindowMs: integerWithin(
      env,
      "INQUIRY_RATE_LIMIT_WINDOW_MS",
      15 * 60_000,
      60_000,
      60 * 60_000,
    ),
    dedupeTtlMs: integerWithin(
      env,
      "INQUIRY_DEDUPE_TTL_MS",
      10 * 60_000,
      60_000,
      60 * 60_000,
    ),
    maxEntries: integerWithin(
      env,
      "INQUIRY_GUARD_MAX_ENTRIES",
      1_000,
      10,
      10_000,
    ),
  };
}
