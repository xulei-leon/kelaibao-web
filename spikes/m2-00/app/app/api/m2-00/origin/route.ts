import { headers } from "next/headers";

import {
  authorizeProbe,
  getProbeIdentity,
  unauthorizedProbeResponse,
} from "../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const requestHeaders = await headers();
  const markerHeader = process.env.M2_ESA_MARKER_HEADER?.toLowerCase();
  const expectedHost = process.env.M2_EXPECTED_HOST;

  return Response.json(
    {
      probeIdentity: getProbeIdentity(),
      hostPreserved:
        Boolean(expectedHost) && requestHeaders.get("host") === expectedHost,
      httpsDetected: requestHeaders.get("x-forwarded-proto") === "https",
      clientAddressPresent: Boolean(
        requestHeaders.get("x-forwarded-for") ??
          requestHeaders.get("x-real-ip"),
      ),
      esaOrigin: markerHeader
        ? Boolean(requestHeaders.get(markerHeader))
        : false,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
