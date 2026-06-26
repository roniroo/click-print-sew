import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

// Crockford-ish base32 without ambiguous characters (no I, L, O, 0, 1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 symbols

/** A human-friendly, high-entropy recovery code, e.g. "K3PA-7QXM-2FRD-9HJN". */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < 16; i++) {
    // 256 % 32 === 0, so this modulo is unbiased.
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out.match(/.{1,4}/g)!.join("-"); // ~80 bits of entropy
}

/** Normalize for comparison: drop separators/case so dashes are optional. */
function normalize(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** scrypt hash with a per-code random salt, stored as "salt:hash" (hex). */
export async function hashRecoveryCode(code: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(normalize(code), salt, 32)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyRecoveryCode(
  code: string,
  stored: string,
): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scrypt(normalize(code), salt, 32)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
