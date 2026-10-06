import { timingSafeEqual } from "node:crypto";

function equalSecret(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function authorizeProbe(request: Request) {
  const expected = process.env.M2_PROBE_TOKEN;
  const provided = request.headers.get("authorization");
  return (
    Boolean(expected) &&
    Boolean(provided) &&
    equalSecret(provided ?? "", `Bearer ${expected}`)
  );
}

export function getProbeIdentity() {
  return process.env.M2_PROBE_IDENTITY ?? "";
}

export function unauthorizedProbeResponse() {
  return Response.json(
    { error: "probe_unauthorized" },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}

export function unconfiguredProbeResponse(provider: string, missing: string[]) {
  return Response.json(
    {
      error: "probe_unconfigured",
      provider,
      missing,
    },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}
