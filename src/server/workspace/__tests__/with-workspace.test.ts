import { Name, StringChunk } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SchemaName, UserId, WorkspaceId } from '@shared/types';
import { AppError } from '@server/errors';
import type { WorkspaceContext } from '../context';

/**
 * A fake Drizzle transaction that records every statement it executes and can be
 * told what the registry lookup returns. Nested `transaction()` calls hand out a
 * child recorder so savepoint use is observable.
 */
type FakeTx = {
  statements: string[];
  children: FakeTx[];
  execute: (q: { queryChunks: unknown[] }) => Promise<{ schema_name: string }[]>;
  transaction: <T>(fn: (inner: FakeTx) => Promise<T>) => Promise<T>;
};

const registry = new Map<string, string>();
const opened: FakeTx[] = [];
const releases: (() => void)[] = [];

/** Renders a Drizzle `sql` object the way Postgres would see it: identifiers quoted, params marked. */
function renderQuery(q: { queryChunks: unknown[] }): string {
  return q.queryChunks
    .map((chunk) => {
      if (chunk instanceof StringChunk) return chunk.value.join('');
      if (chunk instanceof Name) return `"${chunk.value}"`;
      // A bare interpolated value becomes a bound parameter when the query is built.
      return `$${String(chunk)}`;
    })
    .join('');
}

function makeTx(): FakeTx {
  const tx: FakeTx = {
    statements: [],
    children: [],
    execute: (q) => {
      const rendered = renderQuery(q);
      tx.statements.push(rendered);
      const match = /where id = \$(\S+)/.exec(rendered);
      const schema = match?.[1] ? registry.get(match[1]) : undefined;
      return Promise.resolve(schema === undefined ? [] : [{ schema_name: schema }]);
    },
    transaction: async (fn) => {
      const child = makeTx();
      tx.children.push(child);
      return fn(child);
    },
  };
  return tx;
}

vi.mock('@server/db/client', () => ({
  workspaceRoot: {
    transaction: async <T>(fn: (tx: FakeTx) => Promise<T>): Promise<T> => {
      const tx = makeTx();
      opened.push(tx);
      return fn(tx);
    },
  },
}));

const { withWorkspace } = await import('../with-workspace');

const acmeSchema = 'ws_01hzx4kq9v3r8n2m6p7t5w0abc' as SchemaName;
const globexSchema = 'ws_01hzx4kq9v3r8n2m6p7t5w0def' as SchemaName;

const acme: WorkspaceContext = {
  workspaceId: 'acme-id' as WorkspaceId,
  schema: acmeSchema,
  actorId: 'user-1' as UserId,
  role: 'owner',
};
const globex: WorkspaceContext = {
  workspaceId: 'globex-id' as WorkspaceId,
  schema: globexSchema,
  actorId: 'user-1' as UserId,
  role: 'member',
};

describe('withWorkspace', () => {
  beforeEach(() => {
    registry.clear();
    registry.set('acme-id', acmeSchema);
    registry.set('globex-id', globexSchema);
    opened.length = 0;
    releases.length = 0;
  });

  it('checks the registry, then pins search_path with SET LOCAL to the quoted tenant schema only', async () => {
    const result = await withWorkspace(acme, (tx) => Promise.resolve(tx.schema));

    expect(result).toBe(acmeSchema);
    const [tx] = opened;
    expect(tx?.statements).toEqual([
      'select schema_name from public.workspace where id = $acme-id limit 1',
      `set local search_path to "${acmeSchema}"`,
    ]);
    expect(tx?.statements[1]).not.toContain('public');
  });

  it('hands the callback a branded tx that names the workspace and schema', async () => {
    await withWorkspace(acme, (tx) => {
      expect(tx.__brand).toBe('WorkspaceTx');
      expect(tx.workspaceId).toBe(acme.workspaceId);
      expect(tx.schema).toBe(acmeSchema);
      expect(tx.db).toBe(opened[0]);
      return Promise.resolve();
    });
  });

  it('refuses a context whose schema does not match the registry', async () => {
    const tampered: WorkspaceContext = { ...acme, schema: globexSchema };

    await expect(withWorkspace(tampered, () => Promise.resolve('leak'))).rejects.toMatchObject({
      code: 'WORKSPACE_ACCESS_DENIED',
    });
    expect(opened[0]?.statements).toHaveLength(1);
  });

  it('refuses a workspace that is not in the registry', async () => {
    registry.delete('acme-id');

    await expect(withWorkspace(acme, () => Promise.resolve())).rejects.toMatchObject({
      code: 'WORKSPACE_NOT_FOUND',
    });
  });

  it('refuses a schema name that fails the shape check before touching the database', async () => {
    const bad: WorkspaceContext = { ...acme, schema: 'public; drop schema x' as SchemaName };

    await expect(withWorkspace(bad, () => Promise.resolve())).rejects.toBeInstanceOf(AppError);
    expect(opened[0]?.statements).toHaveLength(0);
  });

  it('throws WORKSPACE_CONTEXT_CONFLICT when nested with a different workspace', async () => {
    await expect(
      withWorkspace(acme, () => withWorkspace(globex, () => Promise.resolve('crossed'))),
    ).rejects.toMatchObject({ code: 'WORKSPACE_CONTEXT_CONFLICT' });
    expect(opened).toHaveLength(1);
  });

  it('joins the open transaction as a savepoint when nested with the same workspace', async () => {
    const seen = await withWorkspace(acme, (outer) =>
      withWorkspace(acme, (inner) => Promise.resolve({ outer: outer.db, inner: inner.db })),
    );

    expect(opened).toHaveLength(1);
    expect(opened[0]?.children).toHaveLength(1);
    expect(seen.inner).toBe(opened[0]?.children[0]);
    expect(seen.outer).toBe(opened[0]);
  });

  it('keeps concurrent scopes for different workspaces apart (no shared module state)', async () => {
    const gate = new Promise<void>((resolve) => releases.push(resolve));

    const a = withWorkspace(acme, async (tx) => {
      await gate;
      return tx.schema;
    });
    const b = withWorkspace(globex, async (tx) => {
      await gate;
      return tx.schema;
    });

    for (const release of releases) release();
    await expect(Promise.all([a, b])).resolves.toEqual([acmeSchema, globexSchema]);
  });

  it('propagates the callback error so the transaction rolls back', async () => {
    const boom = new AppError({ code: 'NOT_FOUND', message: 'missing row' });

    await expect(withWorkspace(acme, () => Promise.reject(boom))).rejects.toBe(boom);
  });
});
