/**
 * Drizzle schema for platform tables in the `public` schema.
 * Source of truth is db/schema/*.sql — this is a partial mirror held to it by
 * `pnpm db:check` (docs/DATABASE_DESIGN.md §9). Declare only what the app queries.
 *
 * See docs/DATABASE_DESIGN.md §2 and docs/WORKSPACE_ISOLATION.md §1.
 */
import {
  boolean,
  customType,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { SchemaName, UserId, WorkspaceId } from '@shared/types';

/** Custom bytea column mapping for crypto hashes. */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/** Postgres `inet` — an IP address, read and written as its text form. */
export const inet = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'inet';
  },
});

/** Kinds of hostname that can resolve to a workspace. */
export type WorkspaceDomainKind = 'app' | 'notice';
/** User account lifecycle. */
export type UserAccountStatus = 'active' | 'locked' | 'disabled';
/** Membership lifecycle. */
export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'removed';
/** What an auth challenge is for. Mirrors the CHECK in db/schema (0001, widened by 0003). */
export type AuthChallengePurpose =
  | 'signin_link'
  | 'signin_otp'
  | 'password_reset'
  | 'password_reset_verified'
  | 'email_verify'
  | 'phone_verify'
  | 'invite';

/** Workspace lifecycle status enumeration. */
export const workspaceStatusEnum = pgEnum('workspace_status', [
  'provisioning',
  'trial',
  'active',
  'past_due',
  'suspended',
  'closing',
  'closed',
]);

/** Statutory DPDP data residency regions. */
export const dataRegionEnum = pgEnum('data_region', ['ap-south-1', 'ap-south-2']);

/** Coarse membership role across the platform. */
export const membershipRoleEnum = pgEnum('membership_role', ['owner', 'admin', 'member', 'viewer']);

/** Platform workspace registry table in public schema. */
export const workspace = pgTable('workspace', {
  id: uuid('id').primaryKey().defaultRandom().$type<WorkspaceId>(),
  slug: text('slug').notNull().unique(),
  schemaName: text('schema_name').notNull().unique().$type<SchemaName>(),
  legalName: text('legal_name').notNull(),
  logoUrl: text('logo_url'),
  status: workspaceStatusEnum('status').notNull().default('provisioning'),
  region: dataRegionEnum('region').notNull().default('ap-south-1'),
  sectorKey: text('sector_key'),
  isSignificantDf: boolean('is_significant_df').notNull().default(false),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  provisionedAt: timestamp('provisioned_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  purgeAfter: timestamp('purge_after', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Custom domains and subdomains mapping to workspaces. */
export const workspaceDomain = pgTable('workspace_domain', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspace.id, { onDelete: 'cascade' })
    .$type<WorkspaceId>(),
  hostname: text('hostname').notNull().unique(),
  kind: text('kind').notNull().$type<WorkspaceDomainKind>(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Global user account identity table in public schema. */
export const userAccount = pgTable('user_account', {
  id: uuid('id').primaryKey().defaultRandom().$type<UserId>(),
  email: text('email').notNull().unique(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  phoneE164: text('phone_e164').unique(),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash'),
  mfaSecret: text('mfa_secret'),
  locale: text('locale').notNull().default('en'),
  status: text('status').notNull().default('active').$type<UserAccountStatus>(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Membership relation connecting global users to isolated workspaces. */
export const membership = pgTable('membership', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspace.id, { onDelete: 'cascade' })
    .$type<WorkspaceId>(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userAccount.id, { onDelete: 'cascade' })
    .$type<UserId>(),
  role: membershipRoleEnum('role').notNull().default('member'),
  status: text('status').notNull().default('invited').$type<MembershipStatus>(),
  invitedBy: uuid('invited_by')
    .references(() => userAccount.id)
    .$type<UserId>(),
  invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  removedAt: timestamp('removed_at', { withTimezone: true }),
});

/** Authenticated user sessions stored by hashed token in public schema. */
export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userAccount.id, { onDelete: 'cascade' })
    .$type<UserId>(),
  tokenHash: bytea('token_hash').notNull().unique(),
  workspaceId: uuid('workspace_id')
    .references(() => workspace.id, { onDelete: 'cascade' })
    .$type<WorkspaceId>(),
  ip: inet('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

/**
 * The module catalog. "The sidebar, the role matrix and plan entitlements all
 * read from one list" — see db/schema/0001_platform.sql's comment on this
 * table. Seeded by db/seed/0001_module_permission_catalog.sql, whose module
 * keys are deliberately identical to `ModuleKey` in
 * `src/shared/mock/access-control.ts` so the Access control panel needs no
 * translation layer between the two.
 */
export const moduleCatalog = pgTable('module', {
  key: text('key').primaryKey(),
  groupKey: text('group_key').notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  position: integer('position').notNull(),
  isCore: boolean('is_core').notNull().default(true),
  /** Statutory judgment call, not schema one — left NULL by the seed. */
  sectionRef: text('section_ref'),
});

/**
 * The grantable actions, one row per (module, action) — curated in code, never
 * invented by a request. `role_permission.permission_key` (workspace schema)
 * references this catalog by key, validated in the domain layer since there
 * is no cross-schema FK (see db/schema/0002's comment on `role_permission`).
 */
export const permission = pgTable('permission', {
  key: text('key').primaryKey(),
  moduleKey: text('module_key')
    .notNull()
    .references(() => moduleCatalog.key),
  action: text('action').notNull(),
  label: text('label').notNull(),
  position: integer('position').notNull(),
});

/** Auth challenges for password recovery, OTP verification, and magic links. */
export const authChallenge = pgTable('auth_challenge', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => userAccount.id, { onDelete: 'cascade' })
    .$type<UserId>(),
  email: text('email'),
  phoneE164: text('phone_e164'),
  purpose: text('purpose').notNull().$type<AuthChallengePurpose>(),
  codeHash: bytea('code_hash').notNull(),
  workspaceId: uuid('workspace_id')
    .references(() => workspace.id, { onDelete: 'cascade' })
    .$type<WorkspaceId>(),
  attempts: smallint('attempts').notNull().default(0),
  maxAttempts: smallint('max_attempts').notNull().default(5),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
});
