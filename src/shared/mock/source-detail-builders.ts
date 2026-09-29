/**
 * MOCK DATA — the shorthand the hand-written detail entries are written in.
 *
 * Its only job is to keep each finding and each scan run to one line, so a
 * catalogue this long stays scannable. Split from the entries themselves, which
 * are large enough to need their own files.
 */
import type { PiiCategory } from './data-sources';
import type { ScanRun, ScopeItem, SourceFinding, SourceStat } from './source-details';

export function pii(label: string, isSensitive = false): PiiCategory {
  return { label, isSensitive };
}

export function scope(name: string, isIncluded = true): ScopeItem {
  return { name, isIncluded };
}

export function finding(
  id: string,
  location: string,
  locationDetail: string,
  identifiers: readonly PiiCategory[],
  items: string,
  confidence: string,
  maskedSample: string,
  status: SourceFinding['status'],
): SourceFinding {
  return { id, location, locationDetail, identifiers, items, confidence, maskedSample, status };
}

export function run(
  id: string,
  when: string,
  time: string,
  type: string,
  duration: string,
  items: string,
  delta: string,
  isDeltaZero: boolean,
  status: ScanRun['status'] = 'complete',
): ScanRun {
  return { id, when, time, type, duration, items, delta, isDeltaZero, status };
}

export function stat(kind: SourceStat['kind'], value: string, note?: string): SourceStat {
  return { kind, value, note };
}

export function risk(level: 'high' | 'medium' | 'low' | 'unknown', note?: string): SourceStat {
  return { kind: 'riskLevel', value: '', risk: level, note };
}
