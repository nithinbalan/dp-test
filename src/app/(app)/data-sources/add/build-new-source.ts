/**
 * Turns a completed wizard into a register entry.
 *
 * The new source is `connected` but deliberately carries `pii: 'na'` — connected
 * and never scanned. That is what the register keys its automatic first scan
 * off, so the row the user lands on is already scanning rather than sitting at
 * a result nobody produced.
 */
import type { Connector } from '@shared/mock/connectors';
import type { ConnectResult, DataSource } from '@shared/mock/data-sources';
import { connectionTarget } from './ReviewStep';
import type { AddSourceState } from './AddSourceWizard.types';

const SAMPLING_SUFFIX = { quick: 'quick', standard: 'standard', deep: 'deep' } as const;
const SCHEDULE_SUFFIX = { daily: 'daily 04:00', weekly: 'weekly', manual: 'manual' } as const;

/**
 * What the simulated first scan will report. Apps, databases and mailboxes hold
 * contact data by nature; object stores and log directories usually do not, and
 * claiming otherwise would put a finding on the register that no scan produced.
 */
function firstScanResult(connector: Connector): ConnectResult {
  const findsContactData =
    connector.category === 'db' || connector.category === 'app' || connector.id === 'imap';
  if (!findsContactData) return { pii: 'no', categories: [] };
  return {
    pii: 'yes',
    categories: [
      { label: 'Email', isSensitive: false },
      { label: 'Phone', isSensitive: false },
    ],
  };
}

export function buildNewSource(connector: Connector, state: AddSourceState): DataSource {
  const target = connectionTarget(connector, state);
  return {
    id: `src-new-${String(Date.now())}`,
    connectorId: connector.id,
    name: target === '—' ? connector.name : `${connector.name} · ${target}`,
    description: `${connector.description} · ${SAMPLING_SUFFIX[state.sampling]} sampling · ${SCHEDULE_SUFFIX[state.schedule]}`,
    type: connector.category,
    status: 'connected',
    pii: 'na',
    categories: [],
    lastScanLabel: 'Just now',
    lastScanDetail: 'First scan queued',
    datasetCount: 0,
    connectResult: firstScanResult(connector),
  };
}
