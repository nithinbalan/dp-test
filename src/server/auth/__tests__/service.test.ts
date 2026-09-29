import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SchemaName, UserId, WorkspaceId } from '@shared/types';
import type * as Repository from '../repository';
import type { WorkspaceMembershipRow } from '../repository';

type RepositoryModule = typeof Repository;

/**
 * The repository is mocked wholesale: the service is exercised against an in-memory
 * stand-in for every query, so each business branch (not just input validation) runs
 * without Postgres. Transactions pass a marker `tx` through so the tests can assert
 * which writes were grouped.
 */
const TX = { __marker: 'tx' } as unknown as Parameters<
  Parameters<RepositoryModule['platformTransaction']>[0]
>[0];

const repo = {
  platformTransaction: vi.fn(<T>(fn: (tx: typeof TX) => Promise<T>): Promise<T> =>
    fn(TX),
  ) as unknown as RepositoryModule['platformTransaction'],
  findUserByEmail: vi.fn<RepositoryModule['findUserByEmail']>(),
  findWorkspaceMembershipsForUser: vi.fn<RepositoryModule['findWorkspaceMembershipsForUser']>(),
  findSessionByTokenHash: vi.fn<RepositoryModule['findSessionByTokenHash']>(),
  insertSession: vi.fn<RepositoryModule['insertSession']>(),
  updateSessionWorkspace: vi.fn<RepositoryModule['updateSessionWorkspace']>(),
  touchSessionLastUsed: vi.fn<RepositoryModule['touchSessionLastUsed']>(),
  revokeSessionByTokenHash: vi.fn<RepositoryModule['revokeSessionByTokenHash']>(),
  touchUserLastSeen: vi.fn<RepositoryModule['touchUserLastSeen']>(),
};

vi.mock('../repository', () => repo);

const { hashPassword, hashSha256 } = await import('../crypto');
const {
  selectSessionWorkspace,
  signInWithPassword,
  signOut,
  switchActiveWorkspace,
  validateSession,
} = await import('../service');

const acme: WorkspaceMembershipRow = {
  role: 'owner',
  workspaceId: 'ws-acme' as WorkspaceId,
  slug: 'acme',
  legalName: 'Acme Inc',
  logoUrl: null,
  schemaName: 'ws_acme' as SchemaName,
  status: 'active',
};
const globex: WorkspaceMembershipRow = {
  role: 'member',
  workspaceId: 'ws-globex' as WorkspaceId,
  slug: 'globex',
  legalName: 'Globex Corp',
  logoUrl: null,
  schemaName: 'ws_globex' as SchemaName,
  status: 'trial',
};
const suspended: WorkspaceMembershipRow = {
  role: 'admin',
  workspaceId: 'ws-suspended' as WorkspaceId,
  slug: 'frozen',
  legalName: 'Frozen Ltd',
  logoUrl: null,
  schemaName: 'ws_frozen' as SchemaName,
  status: 'suspended',
};

const PASSWORD = 'Correct-Horse-9!';
let passwordHash: string;

const userId = 'user-1' as UserId;
const baseUser = {
  id: userId,
  email: 'ada@acme.test',
  emailVerifiedAt: null,
  phoneE164: null,
  phoneVerifiedAt: null,
  fullName: 'Ada Lovelace',
  mfaSecret: null,
  locale: 'en',
  status: 'active' as const,
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function sessionLookup(
  overrides: Partial<Repository.SessionLookup> = {},
): Repository.SessionLookup {
  return {
    session: { id: 'sess-1', workspaceId: acme.workspaceId, lastUsedAt: new Date() },
    user: {
      id: userId,
      email: baseUser.email,
      fullName: baseUser.fullName,
      locale: 'en',
      status: 'active',
    },
    memberships: [acme, globex, suspended],
    ...overrides,
  };
}

beforeAll(async () => {
  passwordHash = await hashPassword(PASSWORD);
});

beforeEach(() => {
  vi.clearAllMocks();
  repo.findUserByEmail.mockResolvedValue({ ...baseUser, passwordHash });
  repo.findWorkspaceMembershipsForUser.mockResolvedValue([acme, globex, suspended]);
  repo.findSessionByTokenHash.mockResolvedValue(sessionLookup());
  repo.insertSession.mockResolvedValue();
  repo.updateSessionWorkspace.mockResolvedValue();
  repo.touchSessionLastUsed.mockResolvedValue();
  repo.revokeSessionByTokenHash.mockResolvedValue();
  repo.touchUserLastSeen.mockResolvedValue();
});

describe('signInWithPassword', () => {
  it('returns VALIDATION_FAILED for a blank identifier or password without touching the repository', async () => {
    expect(await signInWithPassword({ identifier: '  ', password: 'x' })).toEqual({
      ok: false,
      error: 'VALIDATION_FAILED',
    });
    expect(await signInWithPassword({ identifier: 'ada@acme.test', password: '' })).toEqual({
      ok: false,
      error: 'VALIDATION_FAILED',
    });
    expect(repo.findUserByEmail).not.toHaveBeenCalled();
  });

  it('issues a session pinned to the first usable workspace and stores only the token hash', async () => {
    const result = await signInWithPassword({ identifier: 'Ada@Acme.test ', password: PASSWORD });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(repo.findUserByEmail).toHaveBeenCalledWith('ada@acme.test');
    expect(result.value.workspace.id).toBe(acme.workspaceId);
    expect(result.value.availableWorkspaces.map((w) => w.slug)).toEqual(['acme', 'globex']);

    const inserted = repo.insertSession.mock.calls[0]?.[0];
    expect(inserted?.tokenHash).toEqual(hashSha256(result.value.rawToken));
    expect(inserted?.workspaceId).toBe(acme.workspaceId);
    expect(inserted?.userId).toBe(userId);
  });

  it('writes the session and the last-seen touch in one transaction', async () => {
    await signInWithPassword({ identifier: 'ada@acme.test', password: PASSWORD });

    expect(repo.platformTransaction).toHaveBeenCalledTimes(1);
    expect(repo.insertSession.mock.calls[0]?.[1]).toBe(TX);
    expect(repo.touchUserLastSeen.mock.calls[0]?.[2]).toBe(TX);
  });

  it('honours a requested workspace slug the user is a member of', async () => {
    const result = await signInWithPassword({
      identifier: 'ada@acme.test',
      password: PASSWORD,
      workspaceSlug: 'GLOBEX',
    });

    expect(result.ok && result.value.workspace.slug).toBe('globex');
  });

  it('denies a requested workspace the user has no usable membership in', async () => {
    expect(
      await signInWithPassword({
        identifier: 'ada@acme.test',
        password: PASSWORD,
        workspaceSlug: 'frozen',
      }),
    ).toEqual({ ok: false, error: 'WORKSPACE_ACCESS_DENIED' });
    expect(repo.insertSession).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with INVALID_CREDENTIALS and issues nothing', async () => {
    expect(await signInWithPassword({ identifier: 'ada@acme.test', password: 'nope' })).toEqual({
      ok: false,
      error: 'INVALID_CREDENTIALS',
    });
    expect(repo.insertSession).not.toHaveBeenCalled();
  });

  it('returns the same INVALID_CREDENTIALS for an unknown user and a disabled one', async () => {
    repo.findUserByEmail.mockResolvedValueOnce(null);
    expect(await signInWithPassword({ identifier: 'ghost@acme.test', password: PASSWORD })).toEqual(
      {
        ok: false,
        error: 'INVALID_CREDENTIALS',
      },
    );

    repo.findUserByEmail.mockResolvedValueOnce({
      ...baseUser,
      passwordHash,
      status: 'disabled' as const,
    });
    expect(await signInWithPassword({ identifier: 'ada@acme.test', password: PASSWORD })).toEqual({
      ok: false,
      error: 'INVALID_CREDENTIALS',
    });
  });
});

describe('validateSession', () => {
  it('returns UNAUTHENTICATED for an empty, unknown, or disabled-user token', async () => {
    expect(await validateSession('')).toEqual({ ok: false, error: 'UNAUTHENTICATED' });
    expect(repo.findSessionByTokenHash).not.toHaveBeenCalled();

    repo.findSessionByTokenHash.mockResolvedValueOnce(null);
    expect(await validateSession('tok')).toEqual({ ok: false, error: 'UNAUTHENTICATED' });

    repo.findSessionByTokenHash.mockResolvedValueOnce(
      sessionLookup({ user: { ...sessionLookup().user, status: 'disabled' as const } }),
    );
    expect(await validateSession('tok')).toEqual({ ok: false, error: 'UNAUTHENTICATED' });
  });

  it('looks the session up by the SHA-256 of the raw token in a single query', async () => {
    await validateSession('raw-token');

    expect(repo.findSessionByTokenHash).toHaveBeenCalledTimes(1);
    expect(repo.findSessionByTokenHash.mock.calls[0]?.[0]).toEqual(hashSha256('raw-token'));
  });

  it('resolves to the host workspace when one is named, without rewriting the session', async () => {
    const result = await validateSession('tok', 'globex');

    expect(result.ok && result.value.activeWorkspace.slug).toBe('globex');
    expect(repo.updateSessionWorkspace).not.toHaveBeenCalled();
  });

  it('denies a host workspace the caller is not a usable member of', async () => {
    expect(await validateSession('tok', 'frozen')).toEqual({
      ok: false,
      error: 'WORKSPACE_ACCESS_DENIED',
    });
    expect(await validateSession('tok', 'nowhere')).toEqual({
      ok: false,
      error: 'WORKSPACE_ACCESS_DENIED',
    });
  });

  it('falls back to the stored workspace when the host names none', async () => {
    repo.findSessionByTokenHash.mockResolvedValueOnce(
      sessionLookup({
        session: { id: 'sess-1', workspaceId: globex.workspaceId, lastUsedAt: new Date() },
      }),
    );
    const result = await validateSession('tok');

    expect(result.ok && result.value.activeWorkspace.slug).toBe('globex');
  });

  it('denies a user with no usable workspace at all', async () => {
    repo.findSessionByTokenHash.mockResolvedValueOnce(sessionLookup({ memberships: [suspended] }));

    expect(await validateSession('tok')).toEqual({ ok: false, error: 'WORKSPACE_ACCESS_DENIED' });
  });

  it('touches last_used_at only when the stored value is stale', async () => {
    await validateSession('tok');
    expect(repo.touchSessionLastUsed).not.toHaveBeenCalled();

    repo.findSessionByTokenHash.mockResolvedValueOnce(
      sessionLookup({
        session: {
          id: 'sess-1',
          workspaceId: null,
          lastUsedAt: new Date(Date.now() - 60 * 60 * 1000),
        },
      }),
    );
    await validateSession('tok');
    expect(repo.touchSessionLastUsed).toHaveBeenCalledWith('sess-1', expect.any(Date));
  });

  it('never exposes the password hash on the resolved user', async () => {
    const result = await validateSession('tok');

    expect(result.ok && result.value.user).toEqual({
      id: userId,
      email: 'ada@acme.test',
      fullName: 'Ada Lovelace',
      locale: 'en',
    });
  });
});

describe('switchActiveWorkspace', () => {
  it('stores a usable target as the session fallback and returns it', async () => {
    const result = await switchActiveWorkspace('tok', globex.workspaceId);

    expect(result.ok && result.value.slug).toBe('globex');
    expect(repo.updateSessionWorkspace).toHaveBeenCalledWith('sess-1', globex.workspaceId);
  });

  it('refuses a target the caller cannot use', async () => {
    expect(await switchActiveWorkspace('tok', suspended.workspaceId)).toEqual({
      ok: false,
      error: 'WORKSPACE_ACCESS_DENIED',
    });
    expect(repo.updateSessionWorkspace).not.toHaveBeenCalled();
  });

  it('returns UNAUTHENTICATED without a valid session', async () => {
    repo.findSessionByTokenHash.mockResolvedValueOnce(null);

    expect(await switchActiveWorkspace('tok', acme.workspaceId)).toEqual({
      ok: false,
      error: 'UNAUTHENTICATED',
    });
  });
});

describe('signOut', () => {
  it('revokes by token hash and treats a missing token as already signed out', async () => {
    await signOut('raw');
    expect(repo.revokeSessionByTokenHash).toHaveBeenCalledWith(hashSha256('raw'), expect.any(Date));

    expect(await signOut('')).toEqual({ ok: true, value: undefined });
    expect(repo.revokeSessionByTokenHash).toHaveBeenCalledTimes(1);
  });
});

describe('selectSessionWorkspace', () => {
  it('pins to the requested slug when the caller is a member of it', () => {
    expect(selectSessionWorkspace([acme, globex], acme.workspaceId, 'globex')).toBe(globex);
  });

  it('never falls back to the stored workspace when a slug was requested', () => {
    expect(selectSessionWorkspace([acme, globex], acme.workspaceId, 'nowhere')).toBeNull();
  });

  it('is case-insensitive and trims the requested slug', () => {
    expect(selectSessionWorkspace([acme, globex], null, '  GloBex ')).toBe(globex);
  });

  it('keeps the stored workspace when no slug was requested, else the first membership', () => {
    expect(selectSessionWorkspace([acme, globex], globex.workspaceId)).toBe(globex);
    expect(selectSessionWorkspace([acme, globex], 'ws-gone' as WorkspaceId)).toBe(acme);
    expect(selectSessionWorkspace([], null)).toBeNull();
  });
});
