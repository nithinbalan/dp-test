/**
 * Cryptographic utilities for authentication and password security.
 *
 * Enforces OWASP password storage recommendations and DPDP data security standards:
 * - Argon2id for password hashing
 * - SHA-256 for opaque session token hashes and verification code hashes
 * - Cryptographically random tokens via node:crypto
 */
import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual as nodeTimingSafeEqual,
} from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

/** OWASP-recommended cost parameters for Argon2id. */
const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

/** Hashes a plaintext password using Argon2id. */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Verifies a plaintext password against an Argon2id hash. */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return verify(hashedPassword, password);
}

/** Computes SHA-256 digest of an input (string or Buffer) as a Buffer for `bytea` storage. */
export function hashSha256(input: string | Buffer): Buffer {
  return createHash('sha256').update(input).digest();
}

/** Generates a high-entropy opaque session token and its SHA-256 hash. */
export function generateSecureToken(byteLength = 32): { rawToken: string; tokenHash: Buffer } {
  const bytes = randomBytes(byteLength);
  const rawToken = bytes.toString('base64url');
  const tokenHash = hashSha256(rawToken);
  return { rawToken, tokenHash };
}

/** Generates a random numeric OTP code (default 6 digits) and its SHA-256 hash. */
export function generateOtpCode(digits = 6): { code: string; codeHash: Buffer } {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  const num = randomInt(min, max + 1);
  const code = num.toString();
  const codeHash = hashSha256(code);
  return { code, codeHash };
}

/** Timing-safe comparison of two Buffers to defend against timing attacks. */
export function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return nodeTimingSafeEqual(a, b);
}
