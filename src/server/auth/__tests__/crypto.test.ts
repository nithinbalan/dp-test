import { describe, expect, it } from 'vitest';
import {
  generateOtpCode,
  generateSecureToken,
  hashPassword,
  hashSha256,
  timingSafeEqual,
  verifyPassword,
} from '../crypto';
import { validatePasswordStrength } from '../password-recovery';

describe('auth/crypto', () => {
  describe('password hashing with Argon2id', () => {
    it('hashes and correctly verifies passwords', async () => {
      const password = 'SuperSecret@Password123!';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toMatch(/^\$argon2id\$/);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);

      const isWrong = await verifyPassword('WrongPassword', hashedPassword);
      expect(isWrong).toBe(false);
    });
  });

  describe('token generation', () => {
    it('generates high entropy 32-byte tokens with matching SHA-256 hash', () => {
      const { rawToken, tokenHash } = generateSecureToken(32);

      expect(rawToken.length).toBeGreaterThanOrEqual(40);
      expect(tokenHash).toBeInstanceOf(Buffer);
      expect(tokenHash.length).toBe(32); // SHA-256 is 32 bytes

      // Recomputing hash matches
      const recomputed = hashSha256(rawToken);
      expect(timingSafeEqual(tokenHash, recomputed)).toBe(true);
    });

    it('generates distinct tokens on subsequent calls', () => {
      const t1 = generateSecureToken();
      const t2 = generateSecureToken();
      expect(t1.rawToken).not.toBe(t2.rawToken);
      expect(t1.tokenHash.equals(t2.tokenHash)).toBe(false);
    });
  });

  describe('OTP generation', () => {
    it('generates 6-digit numeric codes with matching SHA-256 hash', () => {
      const { code, codeHash } = generateOtpCode(6);

      expect(code).toMatch(/^\d{6}$/);
      expect(codeHash.length).toBe(32);

      const recomputed = hashSha256(code);
      expect(timingSafeEqual(codeHash, recomputed)).toBe(true);
    });
  });

  describe('timingSafeEqual', () => {
    it('accurately checks buffer equality', () => {
      const b1 = Buffer.from('abc123xyz');
      const b2 = Buffer.from('abc123xyz');
      const b3 = Buffer.from('abc123xyw');
      const b4 = Buffer.from('short');

      expect(timingSafeEqual(b1, b2)).toBe(true);
      expect(timingSafeEqual(b1, b3)).toBe(false);
      expect(timingSafeEqual(b1, b4)).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('enforces 10+ characters, uppercase, lowercase, number, and special character', () => {
      expect(validatePasswordStrength('Valid@Pass123')).toBe(true);
      expect(validatePasswordStrength('short1@A')).toBe(false); // < 10 chars
      expect(validatePasswordStrength('nouppercase@123')).toBe(false); // no uppercase
      expect(validatePasswordStrength('NOLOWERCASE@123')).toBe(false); // no lowercase
      expect(validatePasswordStrength('NoSpecialChar123')).toBe(false); // no symbol
      expect(validatePasswordStrength('NoNumbersHere!@#')).toBe(false); // no digit
    });
  });
});
