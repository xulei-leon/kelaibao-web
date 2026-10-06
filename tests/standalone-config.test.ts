import { resolve } from "node:path";

import nextConfig from "../next.config";

describe("standalone build configuration", () => {
  it("keeps output file tracing scoped to the kelaibao application", () => {
    const applicationRoot = resolve(process.cwd());

    expect(nextConfig.outputFileTracingRoot).toBe(applicationRoot);
  });
});
