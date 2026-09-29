/**
 * Business rules for the Configuration Studio "Workspace" panel.
 *
 * Owns three decisions the repository deliberately does not: which sectors are
 * selectable, which language is the base one (and that it can never be turned off),
 * and whether a proposed DPO is a live employee of THIS workspace. Expected failures
 * come back as `Result` — see docs/ERROR_HANDLING.md §3.
 *
 * Every read and write runs inside one `withWorkspace()` transaction, so a save that
 * touches both the profile row and the language set cannot half-commit.
 */
import { AppError } from '@server/errors';
import { withWorkspace, type WorkspaceContext, type WorkspaceTx } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import {
  employeeExists,
  findWorkspaceProfile,
  findWorkspaceRegistry,
  listActiveEmployees,
  listWorkspaceLanguages,
  replaceWorkspaceLanguages,
  updateRegistryLegalName,
  upsertWorkspaceProfile,
  type EmployeeOptionRow,
  type WorkspaceProfileRow,
} from './repository';

/**
 * Sectors a workspace may declare. Closed here on purpose: `public.sector` is
 * statutory reference data that is not seeded yet, and `workspace_profile.sector_key`
 * carries no cross-schema FK (the db/schema/0002 header explains why), so this is the
 * allowlist that keeps an arbitrary string out of the column.
 */
export const WORKSPACE_SECTORS = [
  'saas',
  'ecommerce',
  'healthcare',
  'edtech',
  'bfsi',
  'manufacturing',
  'professional',
] as const;
/** One selectable sector. */
export type WorkspaceSector = (typeof WORKSPACE_SECTORS)[number];

/**
 * The base language, always enabled. s.5(3) lets a data principal read in English or
 * an Eighth Schedule language; English is the floor the notice engine falls back to,
 * which is why unselecting it is not an option the service honours.
 */
export const BASE_LANGUAGE_CODE = 'en';

const DEFAULT_SECTOR: WorkspaceSector = 'saas';

/** Longest legal entity name accepted — wide enough for any registered Indian entity. */
const MAX_LEGAL_NAME_LENGTH = 200;

/** Where the logo route serves an attachment's bytes back out. */
function logoUrlFor(logoAttachmentId: string): string {
  return `/api/settings/workspace/logo/${logoAttachmentId}`;
}

/** What the Workspace panel renders. */
export type WorkspaceSettings = {
  legalName: string;
  sector: WorkspaceSector;
  languages: string[];
  dpoEmployeeId: string | null;
  publishDpoContact: boolean;
  /** Servable URL for the uploaded logo, or null when none has been uploaded. */
  logoUrl: string | null;
  /**
   * Sourced from this workspace's `employee` table, so the picker can only offer real
   * people. Empty until the Employees module writes rows — offering the shared mock
   * roster instead would hand the picker ids that are not employee ids and could
   * never be saved.
   */
  dpoCandidates: EmployeeOptionRow[];
};

/** The fields the panel may change. Everything else on the profile is out of scope. */
export type WorkspaceSettingsInput = {
  legalName: string;
  sector: WorkspaceSector;
  languages: string[];
  dpoEmployeeId: string | null;
};

/** Why a save was refused. Each maps to an error code at the route boundary. */
export type SaveWorkspaceSettingsError = 'VALIDATION_FAILED' | 'NOT_FOUND';

function isWorkspaceSector(value: string): value is WorkspaceSector {
  return (WORKSPACE_SECTORS as readonly string[]).includes(value);
}

/** Deduplicates, and guarantees the base language survives an unselect. */
function normaliseLanguages(codes: readonly string[]): string[] {
  return [...new Set([BASE_LANGUAGE_CODE, ...codes])];
}

/**
 * Reads the settings as they currently stand, inside an already-open workspace
 * transaction. When no profile row exists yet the control-plane registry seeds the
 * defaults, so a freshly provisioned workspace opens the panel showing its real legal
 * name rather than a blank field. Reading never writes.
 */
async function readSettings(ctx: WorkspaceContext, tx: WorkspaceTx): Promise<WorkspaceSettings> {
  const [profile, languages, dpoCandidates] = await Promise.all([
    findWorkspaceProfile(tx),
    listWorkspaceLanguages(tx),
    listActiveEmployees(tx),
  ]);

  if (profile === null) {
    const registry = await findWorkspaceRegistry(ctx.workspaceId);
    return {
      legalName: registry?.legalName ?? '',
      sector: DEFAULT_SECTOR,
      languages: normaliseLanguages(languages),
      dpoEmployeeId: null,
      publishDpoContact: true,
      logoUrl: null,
      dpoCandidates,
    };
  }

  return {
    legalName: profile.legalName,
    sector: isWorkspaceSector(profile.sectorKey) ? profile.sectorKey : DEFAULT_SECTOR,
    languages: normaliseLanguages(languages),
    dpoEmployeeId: profile.dpoEmployeeId,
    publishDpoContact: profile.publishDpoContact,
    logoUrl: profile.logoAttachmentId ? logoUrlFor(profile.logoAttachmentId) : null,
    dpoCandidates,
  };
}

/**
 * Guarantees the singleton profile row exists, seeding it from the control-plane
 * registry when this is the workspace's first write of any kind — the logo upload
 * can be the very first save a workspace makes, before it has ever opened the
 * Workspace panel's own save button.
 */
export async function ensureWorkspaceProfile(
  ctx: WorkspaceContext,
  tx: WorkspaceTx,
): Promise<WorkspaceProfileRow> {
  const existing = await findWorkspaceProfile(tx);
  if (existing) return existing;

  const registry = await findWorkspaceRegistry(ctx.workspaceId);
  await upsertWorkspaceProfile(
    {
      legalName: registry?.legalName ?? '',
      sectorKey: DEFAULT_SECTOR,
      dpoEmployeeId: null,
      publishDpoContact: true,
    },
    tx,
  );
  const created = await findWorkspaceProfile(tx);
  if (!created) {
    // Unreachable — the upsert just committed this row inside the same transaction.
    throw new AppError({
      code: 'DB_QUERY_FAILED',
      message: 'workspace profile upsert did not persist',
    });
  }
  return created;
}

/** Current workspace settings for the Configuration Studio "Workspace" panel. */
export async function getWorkspaceSettings(ctx: WorkspaceContext): Promise<WorkspaceSettings> {
  return withWorkspace(ctx, (tx) => readSettings(ctx, tx));
}

/**
 * Saves the panel's fields and returns the settings as they now stand.
 *
 * `publishDpoContact` is deliberately not an input: s.8(9) requires the contact to be
 * published, so the UI renders it locked and no request can turn it off. A
 * `dpoEmployeeId` that is not a live employee of this workspace is `NOT_FOUND`, never
 * a silently dropped field.
 */
export async function saveWorkspaceSettings(
  ctx: WorkspaceContext,
  input: WorkspaceSettingsInput,
): Promise<Result<WorkspaceSettings, SaveWorkspaceSettingsError>> {
  const legalName = input.legalName.trim();
  if (legalName.length === 0 || legalName.length > MAX_LEGAL_NAME_LENGTH) {
    return err('VALIDATION_FAILED');
  }

  const languages = normaliseLanguages(input.languages);

  const result = await withWorkspace(
    ctx,
    async (tx): Promise<Result<WorkspaceSettings, SaveWorkspaceSettingsError>> => {
      if (input.dpoEmployeeId !== null && !(await employeeExists(input.dpoEmployeeId, tx))) {
        return err('NOT_FOUND');
      }

      await upsertWorkspaceProfile(
        {
          legalName,
          sectorKey: input.sector,
          dpoEmployeeId: input.dpoEmployeeId,
          publishDpoContact: true,
        },
        tx,
      );
      await replaceWorkspaceLanguages(languages, BASE_LANGUAGE_CODE, tx);

      return ok(await readSettings(ctx, tx));
    },
  );

  // Only after the tenant write has committed. The registry's copy of the name is a
  // display convenience for the workspace switcher and topbar; a failure updating it
  // must never leave the profile itself unsaved.
  if (result.ok) {
    await updateRegistryLegalName(ctx.workspaceId, legalName);
  }
  return result;
}
