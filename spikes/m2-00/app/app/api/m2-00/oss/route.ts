import {
  authorizeProbe,
  getProbeIdentity,
  unauthorizedProbeResponse,
  unconfiguredProbeResponse,
} from "../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

const requiredEnv = [
  "M2_OSS_DIRECT_URL",
  "M2_OSS_ESA_URL",
  "M2_OSS_VALID_UPLOAD_URL",
  "M2_OSS_EXPIRED_UPLOAD_URL",
  "M2_OSS_CROSS_KEY_UPLOAD_URL",
] as const;

export async function GET(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length) {
    return unconfiguredProbeResponse("OSS", [...missing]);
  }

  const payload = new TextEncoder().encode("m2-00-oss-probe");
  const [direct, esa, validUpload, expiredUpload, crossKeyUpload] =
    await Promise.all([
      fetch(process.env.M2_OSS_DIRECT_URL!, { redirect: "manual" }),
      fetch(process.env.M2_OSS_ESA_URL!, { redirect: "manual" }),
      fetch(process.env.M2_OSS_VALID_UPLOAD_URL!, {
        method: "PUT",
        body: payload,
        headers: { "content-type": "image/png" },
        redirect: "manual",
      }),
      fetch(process.env.M2_OSS_EXPIRED_UPLOAD_URL!, {
        method: "PUT",
        body: payload,
        headers: { "content-type": "image/png" },
        redirect: "manual",
      }),
      fetch(process.env.M2_OSS_CROSS_KEY_UPLOAD_URL!, {
        method: "PUT",
        body: payload,
        headers: { "content-type": "image/png" },
        redirect: "manual",
      }),
    ]);

  return Response.json(
    {
      probeIdentity: getProbeIdentity(),
      bucketPrivate: [401, 403].includes(direct.status),
      directReadRejected: [401, 403].includes(direct.status),
      esaReadSucceeded: esa.ok,
      controlledOrigin: process.env.M2_OSS_CONTROLLED_ORIGIN === "true",
      shortLivedUpload: validUpload.ok,
      expiredRejected: [400, 401, 403].includes(expiredUpload.status),
      crossKeyRejected: [400, 401, 403].includes(crossKeyUpload.status),
      noLongTermCredentials: true,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
