import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserId } from '@shared/types';
import type * as Repository from '../repository';

type RepositoryModule = typeof Repository;
type ChallengeRow = NonNullable<
  Awaited<ReturnType<RepositoryModule['findActivePasswordResetChallengeByEmail']>>
>;

const TX = { __marker: 'tx' } as unknown as Parameters<
  Parameters<RepositoryModule['platformTransaction']>[0]
>[0];

const repo = {
  platformTransaction: vi.fn(<T>(fn: (tx: typeof TX) => Promise<T>): Promise<T> =>
    fn(TX),
  ) as unknown as RepositoryModule['platformTransaction'],
  findUserByEmail: vi.fn<RepositoryModule['findUserByEmail']>(),
  consumeActivePasswordResetChallenges:
    vi.fn<RepositoryModule['consumeActivePasswordResetChallenges']>(),
  insertAuthChallenge: vi.fn<RepositoryModule['insertAuthChallenge']>(),
  findActivePasswordResetChallengeByEmail:
    vi.fn<RepositoryModule['findActivePasswordResetChallengeByEmail']>(),
  setChallengeAttempts: vi.fn<RepositoryModule['setChallengeAttempts']>(),
  markChallengeVerified: vi.fn<RepositoryModule['markChallengeVerified']>(),
  findVerifiedResetChallengeByTokenHash:
    vi.fn<RepositoryModule['findVerifiedResetChallengeByTokenHash']>(),
  updateUserPassword: vi.fn<RepositoryModule['updateUserPassword']>(),
  consumeChallenge: vi.fn<RepositoryModule['consumeChallenge']>(),
  revokeAllSessionsForUser: vi.fn<RepositoryModule['revokeAllSessionsForUser']>(),
};

const sendPasswordResetOtp =
  vi.fn<(recipient: string, channel: string, code: string) => Promise<void>>();

vi.mock('../repository', () => repo);
vi.mock('../notifications', () => ({
  getNotificationProvider: () => ({ sendPasswordResetOtp }),
}));

const { hashSha256, verifyPassword } = await import('../crypto');
const { requestPasswordReset, resetPassword, validatePasswordStrength, verifyResetCode } =
  await import('../password-recovery');

const userId = 'user-1' as UserId;
const user = {
  id: userId,
  email: 'ada@acme.test',
  emailVerifiedAt: null,
  phoneE164: null,
  phoneVerifiedAt: null,
  fullName: 'Ada Lovelace',
  passwordHash: 'old-hash',
  mfaSecret: null,
  locale: 'en',
  status: 'active' as const,
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function challenge(code: string, overrides: Partial<ChallengeRow> = {}): ChallengeRow {
  return {
    id: 'ch-1',
    userId,
    email: user.email,
    phoneE164: null,
    purpose: 'password_reset',
    codeHash: hashSha256(code),
    workspaceId: null,
    attempts: 0,
    maxAttempts: 5,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.findUserByEmail.mockResolvedValue(user);
  repo.consumeActivePasswordResetChallenges.mockResolvedValue();
  repo.insertAuthChallenge.mockResolvedValue();
  repo.setChallengeAttempts.mockResolvedValue();
  repo.markChallengeVerified.mockResolvedValue();
  repo.updateUserPassword.mockResolvedValue();
  repo.consumeChallenge.mockResolvedValue();
  repo.revokeAllSessionsForUser.mockResolvedValue();
  sendPasswordResetOtp.mockResolvedValue();
});

describe('requestPasswordReset', () => {
  it('rejects a blank identifier', async () => {
    expect(await requestPasswordReset('   ')).toEqual({ ok: false, error: 'VALIDATION_FAILED' });
  });

  it('returns ok for an unknown or inactive user and sends nothing (anti-enumeration)', async () => {
    repo.findUserByEmail.mockResolvedValueOnce(null);
    expect(await requestPasswordReset('ghost@acme.test')).toEqual({ ok: true, value: undefined });

    repo.findUserByEmail.mockResolvedValueOnce({ ...user, status: 'disabled' as const });
    expect(await requestPasswordReset('ada@acme.test')).toEqual({ ok: true, value: undefined });

    expect(repo.insertAuthChallenge).not.toHaveBeenCalled();
    expect(sendPasswordResetOtp).not.toHaveBeenCalled();
  });

  it('retires open challenges and issues a hashed 6-digit code in one transaction, then sends the plain code', async () => {
    await requestPasswordReset('Ada@Acme.test', 'whatsapp');

    expect(repo.platformTransaction).toHaveBeenCalledTimes(1);
    expect(repo.consumeActivePasswordResetChallenges).toHaveBeenCalledWith(
      userId,
      expect.any(Date),
      TX,
    );

    const [inserted, tx] = repo.insertAuthChallenge.mock.calls[0] ?? [];
    expect(tx).toBe(TX);
    expect(inserted?.purpose).toBe('password_reset');
    expect(inserted?.maxAttempts).toBe(5);

    const [recipient, channel, code] = sendPasswordResetOtp.mock.calls[0] ?? [];
    expect(recipient).toBe(user.email);
    expect(channel).toBe('whatsapp');
    expect(code).toMatch(/^\d{6}$/);
    expect(inserted?.codeHash).toEqual(hashSha256(code ?? ''));
  });
});

describe('verifyResetCode', () => {
  it('rejects blank inputs before any lookup', async () => {
    expect(await verifyResetCode('', '123456')).toEqual({ ok: false, error: 'VALIDATION_FAILED' });
    expect(await verifyResetCode('ada@acme.test', ' ')).toEqual({
      ok: false,
      error: 'VALIDATION_FAILED',
    });
    expect(repo.findActivePasswordResetChallengeByEmail).not.toHaveBeenCalled();
  });

  it('returns INVALID_CODE when no open challenge exists', async () => {
    repo.findActivePasswordResetChallengeByEmail.mockResolvedValueOnce(null);

    expect(await verifyResetCode('ada@acme.test', '123456')).toEqual({
      ok: false,
      error: 'INVALID_CODE',
    });
  });

  it('refuses once the attempt budget is spent, without counting another attempt', async () => {
    repo.findActivePasswordResetChallengeByEmail.mockResolvedValueOnce(
      challenge('123456', { attempts: 5 }),
    );

    expect(await verifyResetCode('ada@acme.test', '123456')).toEqual({
      ok: false,
      error: 'TOO_MANY_ATTEMPTS',
    });
    expect(repo.setChallengeAttempts).not.toHaveBeenCalled();
  });

  it('spends an attempt BEFORE comparing, so a wrong code always costs one', async () => {
    repo.findActivePasswordResetChallengeByEmail.mockResolvedValueOnce(
      challenge('123456', { attempts: 2 }),
    );

    expect(await verifyResetCode('ada@acme.test', '000000')).toEqual({
      ok: false,
      error: 'INVALID_CODE',
    });
    expect(repo.setChallengeAttempts).toHaveBeenCalledWith('ch-1', 3);
    expect(repo.markChallengeVerified).not.toHaveBeenCalled();
  });

  it('exchanges a correct code for a reset token stored only as a hash', async () => {
    repo.findActivePasswordResetChallengeByEmail.mockResolvedValueOnce(challenge('123456'));

    const result = await verifyResetCode('ada@acme.test', ' 123456 ');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [id, tokenHash, expiresAt] = repo.markChallengeVerified.mock.calls[0] ?? [];
    expect(id).toBe('ch-1');
    expect(tokenHash).toEqual(hashSha256(result.value.resetToken));
    expect(expiresAt?.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('resetPassword', () => {
  const STRONG = 'Correct-Horse-9!';

  it('rejects a weak password or missing token before any lookup', async () => {
    expect(await resetPassword('tok', 'short')).toEqual({ ok: false, error: 'VALIDATION_FAILED' });
    expect(await resetPassword('', STRONG)).toEqual({ ok: false, error: 'VALIDATION_FAILED' });
    expect(repo.findVerifiedResetChallengeByTokenHash).not.toHaveBeenCalled();
  });

  it('returns INVALID_CODE for an unknown or user-less token', async () => {
    repo.findVerifiedResetChallengeByTokenHash.mockResolvedValueOnce(null);
    expect(await resetPassword('tok', STRONG)).toEqual({ ok: false, error: 'INVALID_CODE' });

    repo.findVerifiedResetChallengeByTokenHash.mockResolvedValueOnce(
      challenge('x', { userId: null }),
    );
    expect(await resetPassword('tok', STRONG)).toEqual({ ok: false, error: 'INVALID_CODE' });
    expect(repo.updateUserPassword).not.toHaveBeenCalled();
  });

  it('stores a new argon2 hash, consumes the token, and revokes every session atomically', async () => {
    repo.findVerifiedResetChallengeByTokenHash.mockResolvedValueOnce(
      challenge('x', { purpose: 'password_reset_verified' }),
    );

    expect(await resetPassword('tok', STRONG)).toEqual({ ok: true, value: undefined });

    expect(repo.findVerifiedResetChallengeByTokenHash.mock.calls[0]?.[0]).toEqual(
      hashSha256('tok'),
    );
    expect(repo.platformTransaction).toHaveBeenCalledTimes(1);

    const [id, newHash, , tx] = repo.updateUserPassword.mock.calls[0] ?? [];
    expect(id).toBe(userId);
    expect(tx).toBe(TX);
    expect(newHash).not.toBe(STRONG);
    expect(await verifyPassword(STRONG, newHash ?? '')).toBe(true);

    expect(repo.consumeChallenge).toHaveBeenCalledWith('ch-1', expect.any(Date), TX);
    expect(repo.revokeAllSessionsForUser).toHaveBeenCalledWith(userId, expect.any(Date), TX);
  });
});

describe('validatePasswordStrength', () => {
  it('requires 10+ chars with upper, lower, digit, and special', () => {
    expect(validatePasswordStrength('Short1!')).toBe(false);
    expect(validatePasswordStrength('alllowercase1!')).toBe(false);
    expect(validatePasswordStrength('ALLUPPERCASE1!')).toBe(false);
    expect(validatePasswordStrength('NoDigitsHere!')).toBe(false);
    expect(validatePasswordStrength('NoSpecial123')).toBe(false);
    expect(validatePasswordStrength('Correct-Horse-9!')).toBe(true);
  });
});
