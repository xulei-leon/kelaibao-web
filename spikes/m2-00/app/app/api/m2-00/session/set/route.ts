import { randomBytes } from "node:crypto";

import {
  authorizeProbe,
  unauthorizedProbeResponse,
} from "../../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const value = randomBytes(24).toString("base64url");
  return Response.json(
    { cookieIssued: true },
    {
      headers: {
        "cache-control": "no-store",
        "set-cookie": `m2_session=${value}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=Strict`,
      },
    },
  );
}
