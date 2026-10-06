import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";

const REDIRECTS = [
  ["/services", "/media#services"],
  ["/for/direct-sales", "/media#direct-sales"],
  ["/for/insurance", "/media#insurance"],
  ["/for/securities", "/media#securities"],
  ["/method", "/media#method"],
];

function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolvePort(port));
    });
  });
}

async function waitFor(origin, timeoutMs = 20_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${origin}/api/health`, {
        cache: "no-store",
        redirect: "manual",
      });
      if (response.ok) return;
    } catch {
      // The standalone server may still be starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error("Media redirect smoke timed out waiting for standalone.");
}

async function assertRedirect(origin, source, destination) {
  const input = `${source}?utm_source=m3-03`;
  const expected = destination.replace(
    "/media",
    "/media?utm_source=m3-03",
  );
  const response = await fetch(`${origin}${input}`, {
    cache: "no-store",
    redirect: "manual",
  });
  const location = response.headers.get("location");
  const normalizedLocation = location
    ? `${new URL(location, origin).pathname}${new URL(location, origin).search}${new URL(location, origin).hash}`
    : null;

  if (response.status !== 308 || normalizedLocation !== expected) {
    throw new Error(
      `${input} expected 308 ${expected}, received ${response.status} ${normalizedLocation ?? "<missing Location>"}.`,
    );
  }
}

const configuredOrigin = process.env.MEDIA_REDIRECT_SMOKE_ORIGIN?.replace(
  /\/$/,
  "",
);
const port = configuredOrigin ? null : await availablePort();
const origin = configuredOrigin ?? `http://127.0.0.1:${port}`;
const server = configuredOrigin
  ? null
  : spawn(
      process.execPath,
      [resolve(process.cwd(), ".next/standalone/server.js")],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOSTNAME: "127.0.0.1",
          PORT: String(port),
          SINO_RUNTIME_MODE: "preview",
          SINO_APP_VERSION: "m3-03-redirect-smoke",
        },
        stdio: "ignore",
        windowsHide: true,
      },
    );

try {
  await waitFor(origin);

  for (const [source, destination] of REDIRECTS) {
    await assertRedirect(origin, source, destination);
  }

  // Explicit examples keep the public migration contract easy to audit:
  // /services?utm_source=m3-03 -> /media?utm_source=m3-03#services
  const unknownProfession = await fetch(`${origin}/for/other?x=1`, {
    cache: "no-store",
    redirect: "manual",
  });
  if (unknownProfession.status !== 404) {
    throw new Error(
      `/for/other?x=1 expected 404, received ${unknownProfession.status}.`,
    );
  }

  console.log("Media legacy redirects, query retention, and unknown route: PASS");
} finally {
  server?.kill();
}
