import { createHmac, randomUUID } from "node:crypto";

import type { MainlandLeadRequest } from "@/types/site";

export interface DirectMailConfig {
  endpoint: URL;
  accessKeyId: string;
  accessKeySecret: string;
  accountName: string;
  fromAlias: string;
  toAddress: string;
  timeoutMs: number;
}

export type DirectMailFailureReason =
  | "directmail_rejected"
  | "directmail_timeout"
  | "directmail_unavailable";

export type DirectMailResult =
  | { ok: true }
  | { ok: false; reason: DirectMailFailureReason };

export interface InquiryMailer {
  send(payload: MainlandLeadRequest): Promise<DirectMailResult>;
}

interface BuildRequestInputs {
  timestamp: string;
  nonce: string;
}

interface DirectMailProviderDependencies {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  nonce?: () => string;
}

function percentEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function canonicalize(parameters: Record<string, string>) {
  return Object.entries(parameters)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .join("&");
}

function safeLine(value: string) {
  return value.replace(/\0/g, "").replace(/\r\n?/g, "\n");
}

function buildTextBody(payload: MainlandLeadRequest) {
  const professionLabels: Record<MainlandLeadRequest["profession"], string> = {
    direct_sales: "直销从业者",
    insurance_broker: "保险经纪人/代理人",
    securities_broker: "证券经纪人/从业者",
    other: "其他专业服务",
  };
  return [
    "客来宝官网收到一条新咨询。",
    "",
    `称呼：${safeLine(payload.name)}`,
    `职业：${professionLabels[payload.profession]}`,
    ...(payload.city ? [`城市：${safeLine(payload.city)}`] : []),
    `联系偏好：${payload.contactMethod === "phone" ? "手机" : "微信"}`,
    `联系方式：${safeLine(payload.contactValue)}`,
    "",
    "当前需求：",
    safeLine(payload.needs),
    "",
    "该通知来自同域 /api/inquiry；请按隐私政策处理，不要转发到非获批系统。",
  ].join("\n");
}

export function buildDirectMailRequest(
  payload: MainlandLeadRequest,
  config: DirectMailConfig,
  inputs: BuildRequestInputs,
) {
  const parameters: Record<string, string> = {
    AccessKeyId: config.accessKeyId,
    AccountName: config.accountName,
    Action: "SingleSendMail",
    AddressType: "1",
    Format: "JSON",
    FromAlias: config.fromAlias,
    ReplyToAddress: "false",
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: inputs.nonce,
    SignatureVersion: "1.0",
    Subject: "客来宝官网咨询通知",
    TextBody: buildTextBody(payload),
    Timestamp: inputs.timestamp,
    ToAddress: config.toAddress,
    Version: "2015-11-23",
  };
  const canonicalQuery = canonicalize(parameters);
  const stringToSign = `POST&%2F&${percentEncode(canonicalQuery)}`;
  const signature = createHmac("sha1", `${config.accessKeySecret}&`)
    .update(stringToSign)
    .digest("base64");

  return {
    url: config.endpoint.toString(),
    body: canonicalize({ ...parameters, Signature: signature }),
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    } satisfies RequestInit,
  };
}

export function createDirectMailProvider(
  config: DirectMailConfig,
  dependencies: DirectMailProviderDependencies = {},
): InquiryMailer {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? (() => new Date());
  const nonce = dependencies.nonce ?? randomUUID;

  return {
    async send(payload) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const request = buildDirectMailRequest(payload, config, {
          timestamp: now().toISOString().replace(/\.\d{3}Z$/, "Z"),
          nonce: nonce(),
        });
        const response = await fetchImpl(request.url, {
          ...request.init,
          body: request.body,
          signal: controller.signal,
        });
        return response.ok
          ? { ok: true }
          : { ok: false, reason: "directmail_rejected" };
      } catch (error) {
        return {
          ok: false,
          reason:
            typeof error === "object" &&
            error !== null &&
            "name" in error &&
            error.name === "AbortError"
              ? "directmail_timeout"
              : "directmail_unavailable",
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
