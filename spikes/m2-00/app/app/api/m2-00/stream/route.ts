import {
  authorizeProbe,
  unauthorizedProbeResponse,
} from "../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("m2-stream-start\n"));
      controller.enqueue(encoder.encode("m2-stream-complete\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
