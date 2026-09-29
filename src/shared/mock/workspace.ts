/**
 * MOCK DATA — stands in for `@server/workspace`/`@api/auth` until those are
 * wired to a real database (see docs/DATABASE_DESIGN.md). Every page in
 * `(app)/**` imports data from `src/shared/mock/*` the way it will later
 * import a repository call — same shape, swappable without touching
 * components. Do not use for anything that reaches a real request.
 */

export const MOCK_WORKSPACE = {
  orgName: 'Your Company Pvt Ltd',
  subdomain: 'yourco',
  domain: '.jethurdpdp.com',
  get address() {
    return `${this.subdomain}${this.domain}`;
  },
};

export const MOCK_USER = {
  name: 'Data Protection Lead',
  initials: 'DP',
  role: 'Admin',
};

/**
 * Placeholder target date for the enforcement countdown — the DPDP Act 2023's
 * rules were still being finalised as of this build, so this is illustrative,
 * not a sourced statutory date.
 */
const ENFORCEMENT_TARGET_DATE = new Date('2026-12-31T00:00:00Z');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function daysUntilEnforcement(now: Date = new Date()): number {
  const diff = ENFORCEMENT_TARGET_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}
