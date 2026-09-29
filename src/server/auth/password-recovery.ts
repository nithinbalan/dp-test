/**
 * Password recovery: request an OTP → verify it for a reset token → reset.
 *
 * Security hygiene: anti-enumeration (request always succeeds), attempt-bounding
 * (the counter is incremented BEFORE the compare so a crash cannot grant a free
 * try), and every session is revoked in the same transaction as the new hash.
 * See docs/SECURITY_HYGIENE.md.
 */
import type { ErrorCode } from '@server/errors/codes';
import { err, ok, type Result } from '@shared/lib/result';
import {
  generateOtpCode,
  generateSecureToken,
  hashPassword,
  hashSha256,
  timingSafeEqual,
} from './crypto';
import { getNotificationProvider, type NotificationChannel } from './notifications';
import * as authRepository from './repository';

const OTP_TTL_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Password policy per DPDP security hygiene: 10+ chars, upper, lower, number, special. */
export function validatePasswordStrength(password: string): boolean {
  if (password.length < 10) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;
  return true;
}

/**
 * Initiates the password recovery flow by generating and dispatching a 6-digit OTP code.
 * Anti-enumeration: returns ok even if the email does not exist.
 */
export async function requestPasswordReset(
  identifier: string,
  channel: NotificationChannel = 'email',
): Promise<Result<void, ErrorCode>> {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed) {
    return err('VALIDATION_FAILED');
  }

  const user = await authRepository.findUserByEmail(trimmed);
  if (user?.status !== 'active') {
    return ok(undefined);
  }

  const now = new Date();
  const { code, codeHash } = generateOtpCode(6);

  // Retiring the old challenge and issuing the new one commit together, so a crash
  // between them cannot leave the user with no valid code at all.
  await authRepository.platformTransaction(async (tx) => {
    await authRepository.consumeActivePasswordResetChallenges(user.id, now, tx);
    await authRepository.insertAuthChallenge(
      {
        userId: user.id,
        email: user.email,
        purpose: 'password_reset',
        codeHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      },
      tx,
    );
  });

  await getNotificationProvider().sendPasswordResetOtp(user.email, channel, code);

  return ok(undefined);
}

/** Verifies a 6-digit recovery OTP code, returning a short-lived reset token on success. */
export async function verifyResetCode(
  identifier: string,
  code: string,
): Promise<Result<{ resetToken: string }, ErrorCode>> {
  const trimmed = identifier.trim().toLowerCase();
  const cleanedCode = code.trim();

  if (!trimmed || !cleanedCode) {
    return err('VALIDATION_FAILED');
  }

  const now = new Date();
  const challenge = await authRepository.findActivePasswordResetChallengeByEmail(trimmed, now);
  if (!challenge) {
    return err('INVALID_CODE');
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return err('TOO_MANY_ATTEMPTS');
  }

  await authRepository.setChallengeAttempts(challenge.id, challenge.attempts + 1);

  if (!timingSafeEqual(challenge.codeHash, hashSha256(cleanedCode))) {
    return err('INVALID_CODE');
  }

  const { rawToken, tokenHash } = generateSecureToken(32);
  await authRepository.markChallengeVerified(
    challenge.id,
    tokenHash,
    new Date(now.getTime() + RESET_TOKEN_TTL_MS),
  );

  return ok({ resetToken: rawToken });
}

/** Resets password using a validated reset token, invalidating all sessions for the user. */
export async function resetPassword(
  resetToken: string,
  newPassword: string,
): Promise<Result<void, ErrorCode>> {
  if (!resetToken || !newPassword || !validatePasswordStrength(newPassword)) {
    return err('VALIDATION_FAILED');
  }

  const now = new Date();
  const challenge = await authRepository.findVerifiedResetChallengeByTokenHash(
    hashSha256(resetToken),
    now,
  );
  const userId = challenge?.userId;
  if (!challenge || !userId) {
    return err('INVALID_CODE');
  }

  const newPasswordHash = await hashPassword(newPassword);

  // Atomic: a reset token must never be reusable against an already-changed password,
  // and an old session must never outlive the hash it was issued under.
  await authRepository.platformTransaction(async (tx) => {
    await authRepository.updateUserPassword(userId, newPasswordHash, now, tx);
    await authRepository.consumeChallenge(challenge.id, now, tx);
    await authRepository.revokeAllSessionsForUser(userId, now, tx);
  });

  return ok(undefined);
}
