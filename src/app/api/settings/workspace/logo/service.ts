/**
 * Business rules for the workspace logo upload — the one file-upload path this
 * codebase has today. Which mime types and sizes are acceptable lives here, not
 * in the route; the route only shapes the multipart request into bytes.
 *
 * Every write runs inside one `withWorkspace()` transaction: the attachment row,
 * the profile's `logo_attachment_id`, and (only once that commits) the registry's
 * servable-URL copy, mirroring how `saveWorkspaceSettings` syncs the legal name.
 */
import { createHash } from 'node:crypto';
import {
  findAttachmentFile,
  insertAttachment,
  setWorkspaceLogoAttachment,
  updateRegistryLogoUrl,
  type AttachmentFileRow,
} from '../../repository';
import { ensureWorkspaceProfile, type WorkspaceSettings } from '../../service';
import { withWorkspace, type WorkspaceContext } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import { sniffMimeType } from './sniff-mime-type';
import { buildLogoStorageKey, getObject, putObject } from './storage';

/** 2 MiB — generous for a square brand mark, small enough to keep local disk sane. */
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

/** Why an upload was refused. */
export type UploadLogoError = 'VALIDATION_FAILED';

/** The file bytes a route has already read out of the multipart request. */
export type LogoUploadInput = {
  filename: string;
  bytes: Buffer;
};

/**
 * Validates, stores, and records a new workspace logo, returning the URL the
 * panel and the topbar/sidebar should now render.
 *
 * The stored mime type is SNIFFED from content, never the multipart part's
 * client-declared `Content-Type` — see docs/SECURITY_HYGIENE.md §4.
 */
export async function uploadWorkspaceLogo(
  ctx: WorkspaceContext,
  file: LogoUploadInput,
): Promise<Result<Pick<WorkspaceSettings, 'logoUrl'>, UploadLogoError>> {
  if (file.bytes.byteLength === 0 || file.bytes.byteLength > MAX_LOGO_SIZE_BYTES) {
    return err('VALIDATION_FAILED');
  }
  const mimeType = sniffMimeType(file.bytes);
  if (!mimeType) return err('VALIDATION_FAILED');

  const storageKey = buildLogoStorageKey(ctx.workspaceId, file.filename);
  const sha256 = createHash('sha256').update(file.bytes).digest();

  const logoUrl = await withWorkspace(ctx, async (tx) => {
    await ensureWorkspaceProfile(ctx, tx);
    await putObject(storageKey, file.bytes);
    const attachmentId = await insertAttachment(
      {
        storageKey,
        filename: file.filename,
        mimeType,
        sizeBytes: file.bytes.byteLength,
        sha256,
        scanStatus: 'pending',
      },
      tx,
    );
    await setWorkspaceLogoAttachment(attachmentId, tx);
    return `/api/settings/workspace/logo/${attachmentId}`;
  });

  // Only after the tenant write has committed — the registry's copy is a display
  // convenience for the topbar/sidebar, never the source of truth.
  await updateRegistryLogoUrl(ctx.workspaceId, logoUrl);

  return ok({ logoUrl });
}

/** One logo's stored bytes, resolved from this workspace's own attachment row. */
export type LogoFile = AttachmentFileRow & { bytes: Buffer };

/** Why a logo could not be served back out. */
export type GetLogoError = 'NOT_FOUND';

/** Streams a previously uploaded logo back out, scoped to THIS workspace's tx. */
export async function getWorkspaceLogo(
  ctx: WorkspaceContext,
  attachmentId: string,
): Promise<Result<LogoFile, GetLogoError>> {
  return withWorkspace(ctx, async (tx) => {
    const file = await findAttachmentFile(attachmentId, tx);
    if (!file) return err('NOT_FOUND');
    const bytes = await getObject(file.storageKey);
    return ok({ ...file, bytes });
  });
}
