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

  return Response.json(
    {
      probeIdentity: getProbeIdentity(),
      routeHandler: true,
      nonStreaming: true,
      nodeVersion: process.version,
      deliveryShape:
        process.env.M2_FC_DELIVERY_SHAPE ?? "standalone-candidate-unverified",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
