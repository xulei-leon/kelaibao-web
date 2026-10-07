import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const absolute = join(directory, entry);
    return statSync(absolute).isDirectory()
      ? sourceFiles(absolute)
      : /\.(ts|tsx|css|mjs|json)$/.test(entry)
        ? [absolute]
        : [];
  });
}

describe("independent project contract", () => {
  it("declares an isolated package and the complete validation scripts", () => {
    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, "package.json"), "utf8"),
    ) as { name: string; private: boolean; scripts: Record<string, string> };

    expect(packageJson.name).toBe("kelaibao-website");
    expect(packageJson.private).toBe(true);
    expect(packageJson.scripts).toEqual(
      expect.objectContaining({
        dev: expect.any(String),
        test: expect.any(String),
        lint: expect.any(String),
        typecheck: expect.any(String),
        build: expect.any(String),
      }),
    );
  });

  it("contains every required foundation entry", () => {
    const required = [
      "AGENTS.md",
      "README.md",
      ".env.example",
      "next.config.ts",
      "postcss.config.mjs",
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/app/not-found.tsx",
      "src/app/error.tsx",
      "src/app/globals.css",
      "src/lib/site-content.ts",
      "src/lib/site-config.ts",
    ];

    for (const file of required) {
      expect(existsSync(join(projectRoot, file)), file).toBe(true);
    }
  });

  it("does not import or reference the other product runtimes", () => {
    const files = [
      ...sourceFiles(join(projectRoot, "src")),
      join(projectRoot, "package.json"),
      join(projectRoot, "next.config.ts"),
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(projectRoot, file)).not.toMatch(
        /products[\\/](?:sino-en|geo-agent)|Sino Media Hub|AI Discovery\s*&\s*GEO/i,
      );
    }
  });

  it("uses the migrated runtime path and public brand in active files", () => {
    const files = [
      ...sourceFiles(join(projectRoot, "src")),
      ...sourceFiles(join(projectRoot, "scripts")),
      ...sourceFiles(join(projectRoot, "deploy")),
      join(projectRoot, ".env.example"),
      join(projectRoot, "AGENTS.md"),
      join(projectRoot, "README.md"),
      join(projectRoot, "package.json"),
      join(projectRoot, "next.config.ts"),
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(projectRoot, file)).not.toMatch(
        /products[\\/]sino-cn|赛诺全网/,
      );
    }
  });
});
