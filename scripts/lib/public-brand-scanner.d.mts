export interface PublicBrandLeak {
  kind: string;
  match: string;
}

export interface PublicBrandOutput {
  path: string;
  content: string;
}

export const INTERNAL_COMPATIBILITY_ALLOWLIST: Readonly<
  Record<string, { identifiers: readonly string[]; reason: string }>
>;
export const PUBLIC_BRAND_SCAN_TARGETS: readonly string[];
export function findPublicBrandLeaks(value: string): PublicBrandLeak[];
export function findSourceBrandLeaks(
  relativePath: string,
  value: string,
): PublicBrandLeak[];
export function scanPublicBrandSurfaces(packageRoot: string): {
  outputs: PublicBrandOutput[];
  findings: Array<PublicBrandLeak & { path: string }>;
};
