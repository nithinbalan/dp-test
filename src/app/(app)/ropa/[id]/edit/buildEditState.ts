import type { ActivityDetail } from '@shared/hooks';
import { DATA_SOURCES } from '@shared/mock/data-sources';
import type { AddActivityState } from '../../add/AddActivityWizard.types';

/**
 * Best-effort mapping from the activity's locked `retention_rule` sentence back onto
 * the wizard's fixed retention-period list — the record stores the free-text sentence
 * the wizard's own value once produced (or a legacy one from the seed fixtures), not
 * the key itself, so re-selecting the exact option isn't always recoverable.
 */
/** Maps a parsed `<amount> year|month` pair onto the wizard's period buckets. */
function retentionFromAmount(amount: number, unit: string): AddActivityState['retention'] {
  if (unit === 'month') return amount <= 12 ? '12-months' : '24-months';
  if (amount <= 1) return '12-months';
  if (amount === 2) return '24-months';
  if (amount >= 7) return '8-years-tax';
  return 'until-purpose';
}

function retentionToState(retentionRule: string): AddActivityState['retention'] {
  const lower = retentionRule.toLowerCase();
  if (lower.includes('kyc')) return 'kyc';
  if (lower.includes('majority')) return 'majority';
  if (lower.includes('day')) return '90-days';
  if (lower.includes('until the purpose')) return 'until-purpose';

  const match = /(\d+)\s*(year|month)/.exec(lower);
  if (!match?.[1] || !match[2]) return 'until-purpose';
  return retentionFromAmount(Number(match[1]), match[2]);
}

/** The activity's `custom.systems` (data-source names) mapped back onto the wizard's
 * `DATA_SOURCES` id values, since the wizard's picker is keyed by id, not name. */
function systemsToStorageLocations(systems: readonly string[]): string[] {
  return systems
    .map((name) => DATA_SOURCES.find((source) => source.name === name)?.id)
    .filter((id): id is string => id !== undefined);
}

export function buildEditState(activity: ActivityDetail): AddActivityState {
  return {
    name: activity.name,
    purpose: activity.purpose,
    principals: activity.principalType,
    identifiers: activity.dataCategories,
    collectionSource: 'direct',
    storageLocations: systemsToStorageLocations(activity.systems),
    retention: activity.retentionUnknown ? 'until-purpose' : retentionToState(activity.retention),
    lawfulBasis: activity.lawfulBasis,
    processors: activity.processors,
    ownerId: activity.ownerId,
    crossBorder: activity.crossBorder.toLowerCase().includes('india') ? 'india' : 's16',
    operations: activity.operations,
    securityMeasures: activity.security,
  };
}
