import {
  authorizeProbe,
  getProbeIdentity,
  unauthorizedProbeResponse,
  unconfiguredProbeResponse,
} from "../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

const requiredEnv = [
  "M2_ESA_PURGE_API_URL",
  "M2_ESA_PURGE_AUTHORIZATION",
  "M2_ESA_PURGE_REQUEST_BODY",
  "M2_ESA_PURGED_URL",
  "M2_ESA_CONTROL_URL",
  "M2_ESA_EXPECTED_PURGED_MARKER",
  "M2_ESA_EXPECTED_CONTROL_MARKER",
] as const;

export async function POST(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length) {
    return unconfiguredProbeResponse("ESA", [...missing]);
  }

  let requestBody: unknown;
  try {
    requestBody = JSON.parse(process.env.M2_ESA_PURGE_REQUEST_BODY!);
  } catch {
    return unconfiguredProbeResponse("ESA", [
      "valid JSON M2_ESA_PURGE_REQUEST_BODY",
    ]);
  }

  const serializedBody = JSON.stringify(requestBody);
  const purgedUrl = process.env.M2_ESA_PURGED_URL!;
  const controlUrl = process.env.M2_ESA_CONTROL_URL!;
  const exactUrls =
    serializedBody.includes(purgedUrl) && !serializedBody.includes(controlUrl);

  const purgeResponse = await fetch(process.env.M2_ESA_PURGE_API_URL!, {
    method: "POST",
    headers: {
      authorization: process.env.M2_ESA_PURGE_AUTHORIZATION!,
      "content-type": "application/json",
    },
    body: serializedBody,
    redirect: "error",
  });

  const [purgedResponse, controlResponse] = await Promise.all([
    fetch(purgedUrl, { cache: "no-store", redirect: "error" }),
    fetch(controlUrl, { cache: "no-store", redirect: "error" }),
  ]);
  const [purgedText, controlText] = await Promise.all([
    purgedResponse.text(),
    controlResponse.text(),
  ]);

  return Response.json(
    {
      probeIdentity: getProbeIdentity(),
      exactUrls,
      purgeAccepted: purgeResponse.ok,
      refreshedObserved: purgedText.includes(
        process.env.M2_ESA_EXPECTED_PURGED_MARKER!,
      ),
      unrelatedUrlUnchanged: controlText.includes(
        process.env.M2_ESA_EXPECTED_CONTROL_MARKER!,
      ),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
