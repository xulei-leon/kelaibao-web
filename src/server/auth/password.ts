import {
  argon2id,
  hash,
  needsRehash,
  verify,
  type HashOptions,
} from "argon2";
import { randomBytes } from "node:crypto";

type Environment = Record<string, string | undefined>;

export interface Argon2Config {
  memoryCost: number;
  timeCost: number;
  parallelism: 1;
  hashLength: number;
}

const MIN_MEMORY_COST_KIB = 19_456;
const MAX_MEMORY_COST_KIB = 131_072;
const MIN_TIME_COST = 2;
const MAX_TIME_COST = 10;
const MIN_HASH_LENGTH = 32;
const MAX_HASH_LENGTH = 64;

function integer(
  env: Environment,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const raw = env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}.`,
    );
  }
  return value;
}

export function resolveArgon2Config(
  env: Environment = process.env,
): Argon2Config {
  const memoryCost = integer(
    env,
    "ARGON2_MEMORY_COST_KIB",
    MIN_MEMORY_COST_KIB,
    MIN_MEMORY_COST_KIB,
    MAX_MEMORY_COST_KIB,
  );
  const timeCost = integer(
    env,
    "ARGON2_TIME_COST",
    MIN_TIME_COST,
    MIN_TIME_COST,
    MAX_TIME_COST,
  );
  const parallelism = integer(env, "ARGON2_PARALLELISM", 1, 1, 1);
  const hashLength = integer(
    env,
    "ARGON2_HASH_LENGTH",
    MIN_HASH_LENGTH,
    MIN_HASH_LENGTH,
    MAX_HASH_LENGTH,
  );
  return {
    memoryCost,
    timeCost,
    parallelism: parallelism as 1,
    hashLength,
  };
}

export function assertAdminPassword(password: string) {
  if ([...password].length < 14) {
    throw new Error("Administrator password must contain at least 14 characters.");
  }
  if (Buffer.byteLength(password, "utf8") > 1_024) {
    throw new Error("Administrator password is too long.");
  }
}

function options(config: Argon2Config): HashOptions {
  return {
    type: argon2id,
    memoryCost: config.memoryCost,
    timeCost: config.timeCost,
    parallelism: config.parallelism,
    hashLength: config.hashLength,
  };
}

export async function hashAdminPassword(
  password: string,
  config: Argon2Config = resolveArgon2Config(),
) {
  assertAdminPassword(password);
  return hash(password, {
    ...options(config),
    salt: randomBytes(16),
  });
}

export async function verifyAdminPassword(
  encodedHash: string,
  password: string,
) {
  try {
    return await verify(encodedHash, password);
  } catch {
    return false;
  }
}

export function needsAdminPasswordRehash(
  encodedHash: string,
  config: Argon2Config = resolveArgon2Config(),
) {
  try {
    return needsRehash(encodedHash, options(config));
  } catch {
    return true;
  }
}
