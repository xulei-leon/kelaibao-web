import { createHmac, randomUUID } from "node:crypto";

import {
  authorizeProbe,
  getProbeIdentity,
  unauthorizedProbeResponse,
  unconfiguredProbeResponse,
} from "../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

const requiredEnv = [
  "M2_DIRECTMAIL_ACCESS_KEY_ID",
  "M2_DIRECTMAIL_ACCESS_KEY_SECRET",
  "M2_DIRECTMAIL_ACCOUNT_NAME",
  "M2_DIRECTMAIL_TEST_RECIPIENT",
  "M2_DIRECTMAIL_TEST_DOMAIN",
] as const;

function encode(value: string) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/%7E/g, "~");
}

function signParameters(parameters: Record<string, string>, secret: string) {
  const canonical = Object.keys(parameters)
    .sort()
    .map((key) => `${encode(key)}=${encode(parameters[key])}`)
    .join("&");
  const stringToSign = `POST&${encode("/")}&${encode(canonical)}`;
  return createHmac("sha1", `${secret}&`)
    .update(stringToSign)
    .digest("base64");
}

export async function POST(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length) {
    return unconfiguredProbeResponse("DirectMail", [...missing]);
  }

  const accountName = process.env.M2_DIRECTMAIL_ACCOUNT_NAME!;
  const testDomain = process.env.M2_DIRECTMAIL_TEST_DOMAIN!;
  const parameters: Record<string, string> = {
    AccessKeyId: process.env.M2_DIRECTMAIL_ACCESS_KEY_ID!,
    AccountName: accountName,
    Action: "SingleSendMail",
    AddressType: "1",
    Format: "JSON",
    HtmlBody: "<p>M2-00 isolated DirectMail probe.</p>",
    ReplyToAddress: "false",
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: randomUUID(),
    SignatureVersion: "1.0",
    Subject: "M2-00 isolated DirectMail probe",
    TagName: "",
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    ToAddress: process.env.M2_DIRECTMAIL_TEST_RECIPIENT!,
    Version: "2015-11-23",
  };
  parameters.Signature = signParameters(
    parameters,
    process.env.M2_DIRECTMAIL_ACCESS_KEY_SECRET!,
  );

  const response = await fetch("https://dm.aliyuncs.com/", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parameters),
    redirect: "error",
  });

  return Response.json(
    {
      probeIdentity: getProbeIdentity(),
      provider: "DirectMail",
      httpsApi: true,
      testDomain: accountName.endsWith(`@${testDomain}`),
      delivered: response.ok,
      noPiiLogs: true,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
