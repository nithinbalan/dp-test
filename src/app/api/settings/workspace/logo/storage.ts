/**
 * Object storage for uploaded files, behind the interface an S3 adapter will
 * implement later — nothing else in this module should need to change when that
 * swap happens. Local disk only, under a gitignored `.uploads/` at the repo root
 * (never `public/`: a static asset there is servable to anyone on any tenant
 * without the workspace-scoped check `GET .../logo/[attachmentId]/route.ts` does).
 *
 * `key` is always `storage_key` from the `attachment` row — see
 * db/schema/0002_workspace_template.sql §17 ("object-store path, prefixed
 * `ws:<id>/`"). Never accept a key from a request; only this module's own
 * `buildLogoStorageKey` produces one.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, normalize, resolve, sep } from 'node:path';
import { AppError } from '@server/errors';
import type { WorkspaceId } from '@shared/types';

const UPLOAD_ROOT = resolve(process.cwd(), '.uploads');

/**
 * A storage key's on-disk path, refusing to resolve outside {@link UPLOAD_ROOT}.
 * `:` is legal in an object-store key but not in a Windows path segment, so it is
 * mapped to `_` for the local adapter only — the key stored in `attachment.storage_key`
 * keeps its real `ws:<id>/` form; only where it touches disk does it change.
 */
function resolveStoragePath(key: string): string {
  const path = resolve(UPLOAD_ROOT, normalize(key.replaceAll(':', '_')));
  if (path !== UPLOAD_ROOT && !path.startsWith(UPLOAD_ROOT + sep)) {
    throw new AppError({
      code: 'VALIDATION_FAILED',
      message: `storage key escapes upload root: ${key}`,
    });
  }
  return path;
}

/** Writes bytes under `key`, creating parent directories as needed. */
export async function putObject(key: string, bytes: Buffer): Promise<void> {
  const path = resolveStoragePath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
}

/** Reads back the bytes stored under `key`. */
export async function getObject(key: string): Promise<Buffer> {
  return readFile(resolveStoragePath(key));
}

/**
 * A fresh, collision-free storage key for a workspace logo. Prefixed `ws:<id>/`
 * per the `attachment.storage_key` convention, so a future S3 bucket shared
 * across workspaces still partitions cleanly by tenant.
 */
export function buildLogoStorageKey(workspaceId: WorkspaceId, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `ws:${workspaceId}/logo/${globalThis.crypto.randomUUID()}-${safeName}`;
}
