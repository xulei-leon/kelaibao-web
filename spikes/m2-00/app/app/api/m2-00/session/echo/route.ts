import { cookies } from "next/headers";

import {
  authorizeProbe,
  getProbeIdentity,
  unauthorizedProbeResponse,
} from "../../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const cookieStore = await cookies();
  return Response.json(
    {
      probeIdentity: getProbeIdentity(),
      roundTrip: Boolean(cookieStore.get("m2_session")?.value),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
