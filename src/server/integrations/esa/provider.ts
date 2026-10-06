import {
  createHash,
  createHmac,
  randomUUID,
} from "node:crypto";

type Environment = Record<string, string | undefined>;

export interface EsaPurgeConfig {
  endpoint: string;
  siteId: string;
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
}

function required(env: Environment, name: string) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required for ESA purge access.`);
  return value;
}

export function resolveEsaPurgeConfig(
  env: Environment = process.env,
): EsaPurgeConfig {
  const endpoint = required(env, "ESA_PURGE_ENDPOINT").replace(/\/+$/, "");
  const url = new URL(endpoint);
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("ESA_PURGE_ENDPOINT must be an exact HTTPS origin.");
  }
  const siteId = required(env, "ESA_SITE_ID");
  if (!/^[1-9][0-9]{0,19}$/.test(siteId)) {
    throw new Error("ESA_SITE_ID must be a positive numeric identifier.");
  }
  return {
    endpoint: url.origin,
    siteId,
    accessKeyId: required(env, "ESA_ACCESS_KEY_ID"),
    accessKeySecret: required(env, "ESA_ACCESS_KEY_SECRET"),
    securityToken: required(env, "ESA_SECURITY_TOKEN"),
  };
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function rfc3986(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function canonicalQuery(parameters: Record<string, string>) {
  return Object.entries(parameters)
    .map(([name, value]) => [rfc3986(name), rfc3986(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
}

function normalizedHeaderValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function signedHeaders(
  endpoint: URL,
  headers: Record<string, string>,
) {
  const values: Record<string, string> = {
    host: endpoint.host,
    ...Object.fromEntries(
      Object.entries(headers).map(([name, value]) => [
        name.toLowerCase(),
        normalizedHeaderValue(value),
      ]),
    ),
  };
  const names = Object.keys(values).sort();
  return {
    canonical: names.map((name) => `${name}:${values[name]}\n`).join(""),
    names: names.join(";"),
  };
}

export class EsaPurgeError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(`ESA purge request failed: ${code}.`);
  }
}

export class DirectHttpsEsaPurgeProvider {
  constructor(
    private readonly config: EsaPurgeConfig,
    private readonly request: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
    private readonly createNonce: () => string = randomUUID,
  ) {}

  async purgeUrls({
    urls,
    idempotencyKey,
  }: {
    urls: string[];
    idempotencyKey: string;
  }) {
    if (
      urls.length < 1 ||
      urls.length > 6 ||
      urls.some((value) => {
        const url = new URL(value);
        return (
          url.protocol !== "https:" ||
          url.origin !== new URL(urls[0]).origin ||
          value.includes("*")
        );
      })
    ) {
      throw new Error("ESA purge URLs are outside the allowed boundary.");
    }
    if (!/^[a-f0-9]{64}$/i.test(idempotencyKey)) {
      throw new Error("ESA purge idempotency key must be a SHA-256 value.");
    }

    const endpoint = new URL(this.config.endpoint);
    const date = this.now()
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
    const payloadHash = sha256("");
    const headers: Record<string, string> = {
      "x-acs-action": "PurgeCaches",
      "x-acs-content-sha256": payloadHash,
      "x-acs-date": date,
      "x-acs-signature-nonce": this.createNonce(),
      "x-acs-version": "2024-09-10",
      "x-acs-security-token": this.config.securityToken,
      "x-saino-idempotency-key": idempotencyKey,
    };
    const query = canonicalQuery({
      Content: JSON.stringify({ Files: urls }),
      SiteId: this.config.siteId,
      Type: "file",
    });
    const signatureHeaders = signedHeaders(endpoint, headers);
    const canonicalRequest = [
      "POST",
      "/",
      query,
      signatureHeaders.canonical,
      signatureHeaders.names,
      payloadHash,
    ].join("\n");
    const signature = createHmac(
      "sha256",
      this.config.accessKeySecret,
    )
      .update(`ACS3-HMAC-SHA256\n${sha256(canonicalRequest)}`)
      .digest("hex");
    headers.authorization = [
      "ACS3-HMAC-SHA256",
      `Credential=${this.config.accessKeyId},`,
      `SignedHeaders=${signatureHeaders.names},`,
      `Signature=${signature}`,
    ].join(" ");

    let response: Response;
    try {
      response = await this.request(`${endpoint.origin}/?${query}`, {
        method: "POST",
        headers,
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      throw new EsaPurgeError("network_or_timeout", true);
    }
    if (!response.ok) {
      throw new EsaPurgeError(
        `http_${response.status}`,
        response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new EsaPurgeError("invalid_json", true);
    }
    const body = result as { RequestId?: unknown; TaskId?: unknown };
    if (
      typeof body.RequestId !== "string" ||
      !body.RequestId ||
      typeof body.TaskId !== "string" ||
      !body.TaskId
    ) {
      throw new EsaPurgeError("invalid_response", true);
    }
    return {
      providerRequestId: body.RequestId,
      providerTaskId: body.TaskId,
    };
  }
}
