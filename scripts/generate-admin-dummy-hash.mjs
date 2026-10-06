import { argon2id, hash } from "argon2";
import { randomBytes } from "node:crypto";

function integer(name, fallback, minimum, maximum) {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${name} is outside the allowed range.`);
  }
  return value;
}

const encoded = await hash(randomBytes(32), {
  type: argon2id,
  memoryCost: integer(
    "ARGON2_MEMORY_COST_KIB",
    19_456,
    19_456,
    131_072,
  ),
  timeCost: integer("ARGON2_TIME_COST", 2, 2, 10),
  parallelism: integer("ARGON2_PARALLELISM", 1, 1, 1),
  hashLength: integer("ARGON2_HASH_LENGTH", 32, 32, 64),
});

console.log(encoded);
