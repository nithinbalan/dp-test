/**
 * Bidirectional mapping between the wizard's plain-language keys (`AddActivityState`,
 * `src/app/(app)/ropa/add/AddActivityWizard.types.ts`) and the DB's statutory columns
 * (`lawful_basis`/`approval_state` enums, `processing_activity`'s locked text columns).
 * English canonical — these are legal citations and DB enum values, not UI copy, so
 * they don't go through the translator the way field labels do.
 */
import type { ActivityStatus, LawfulBasis as UiLawfulBasis } from '@shared/mock/ropa';
import type { ActivityOperationKind, ApprovalState, DraftedBy, LawfulBasis } from './repository';

/** The wizard's six basis keys → the DB enum + its s.6/s.7/s.8/s.9 citation. */
const BASIS_TO_DB: Record<UiLawfulBasis, { basis: LawfulBasis; basisRef: string }> = {
  consent: { basis: 'consent', basisRef: 's.6' },
  voluntary: { basis: 'voluntary_provision', basisRef: 's.7(a)' },
  employment: { basis: 'employment', basisRef: 's.7(i)' },
  'legal-obligation': { basis: 'legal_obligation', basisRef: 's.7(d)' },
  'parental-consent': { basis: 'parental_consent', basisRef: 's.9' },
  security: { basis: 'security_safeguards', basisRef: 's.8(5)' },
};

const DB_TO_BASIS: Partial<Record<LawfulBasis, UiLawfulBasis>> = Object.fromEntries(
  Object.entries(BASIS_TO_DB).map(([ui, { basis }]) => [basis, ui]),
);

export function basisToDb(basis: UiLawfulBasis): { basis: LawfulBasis; basisRef: string } {
  return BASIS_TO_DB[basis];
}

/** Narrows a request-body string to the wizard's six basis keys — the request-body
 * value is untrusted input, so this is a real validation check, not a formality. */
export function isUiLawfulBasis(value: string): value is UiLawfulBasis {
  return value in BASIS_TO_DB;
}

/** Falls back to `consent` for a DB value the wizard doesn't offer (e.g. `court_order`) —
 * display-only, never round-tripped back through a write the wizard itself made. */
export function basisFromDb(basis: LawfulBasis): UiLawfulBasis {
  return DB_TO_BASIS[basis] ?? 'consent';
}

/** The wizard's seven retention keys → a locked statutory sentence + optional day count. */
const RETENTION_TO_DB: Record<string, { retentionRule: string; days: number | null }> = {
  'until-purpose': { retentionRule: 'Until the purpose is served', days: null },
  '12-months': { retentionRule: '12 months', days: 365 },
  '24-months': { retentionRule: '24 months', days: 730 },
  '8-years-tax': { retentionRule: '8 years (tax law)', days: 2922 },
  kyc: { retentionRule: 'Per KYC law', days: null },
  '90-days': { retentionRule: '90 days rolling', days: 90 },
  majority: { retentionRule: 'Till majority + purpose', days: null },
};

export function retentionToDb(retention: string): { retentionRule: string; days: number | null } {
  return RETENTION_TO_DB[retention] ?? { retentionRule: retention, days: null };
}

/** Maps `processing_activity.status`/`drafted_by` onto the UI's three-state badge. */
export function statusFromDb(status: ApprovalState, draftedBy: DraftedBy): ActivityStatus {
  if (status === 'approved') return 'approved';
  if (status === 'draft' && draftedBy === 'ai') return 'ai-draft';
  return 'needs-review';
}

/** The wizard's Capitalized tag labels → the CHECK-constrained lowercase enum values. */
const OPERATION_TO_DB: Record<string, ActivityOperationKind> = {
  Collection: 'collection',
  Storage: 'storage',
  Use: 'use',
  Sharing: 'sharing',
  Retrieval: 'retrieval',
  Erasure: 'erasure',
};

export function operationsToDb(operations: readonly string[]): ActivityOperationKind[] {
  return operations
    .map((op) => OPERATION_TO_DB[op])
    .filter((op): op is ActivityOperationKind => op !== undefined);
}

/** Title-cases a lowercase DB operation back for display (`storage` → `Storage`). */
export function operationFromDb(operation: string): string {
  return operation.charAt(0).toUpperCase() + operation.slice(1);
}

/** The wizard's principal-type keys → the free-text label the detail/list views show. */
const PRINCIPAL_TO_LABEL: Record<string, string> = {
  customers: 'Customers',
  consumers: 'Consumers',
  employees: 'Employees',
  candidates: 'Candidates',
  vendors: 'Vendor contacts',
  minors: 'Minors + guardians',
  all: 'All principals',
};

export function principalTypeToLabel(principalType: string): string {
  return PRINCIPAL_TO_LABEL[principalType] ?? principalType;
}

/** The two cross-border wizard keys → the free-text sentence the detail view shows. */
export function crossBorderLabel(crossesBorder: boolean): string {
  return crossesBorder
    ? 'Yes, sometimes — s.16 negative-list check'
    : 'No — stays in India (confirmed by owner)';
}

/** The wizard's "How do you get it?" select keys → the free-text label stored verbatim
 * (the DB column is plain `text`, not a locked enum — no reverse mapping needed on read). */
const COLLECTION_SOURCE_TO_LABEL: Record<string, string> = {
  direct: 'Directly from the person',
  partner: 'From a partner or third party',
  'employee-records': 'From employee records',
  generated: 'Generated by our systems',
  public: 'From public sources',
};

export function collectionSourceLabel(source: string): string {
  return COLLECTION_SOURCE_TO_LABEL[source] ?? source;
}
