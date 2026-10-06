export const CLAIM_FIELDS: readonly string[];

export interface ClaimsValidationOptions {
  now?: Date | string;
  publicOutputs?: Array<string | { content: string; path?: string }>;
}

export function validateClaimsRegister<T>(
  input: T,
  options?: ClaimsValidationOptions,
): T;
