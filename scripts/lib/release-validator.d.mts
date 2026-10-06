export const LOCAL_CHECK_IDS: readonly string[];
export const PRODUCTION_GATE_IDS: readonly string[];
export const M3_LOCAL_CHECK_IDS: readonly string[];
export const M3_PRODUCTION_GATE_IDS: readonly string[];

export function validateReleaseGateInput<T>(input: T): T;

export function evaluateRelease(input: unknown): {
  localReady: boolean;
  productionReady: boolean;
  status:
    | "LOCAL_NOT_READY"
    | "CODE_READY_WITH_EXTERNAL_LEGACY"
    | "PRODUCTION_LIVE_READY";
  localBlockers: string[];
  productionBlockers: string[];
};
