/**
 * MOCK DATA — see the note in `workspace.ts`. Per-person device/agent and
 * awareness-training status, joined against `PEOPLE` by Endpoints.
 *
 * The Employees page reads real `endpoint_device`/`enrollment` rows via
 * `/api/employees` instead (see `src/app/api/employees/service.ts`) — this
 * file now backs Endpoints only, until that module gets its own real source.
 */
import { PEOPLE } from './people';

export type AgentStatus = 'active' | 'outdated' | 'not-installed';
export type AwarenessStatus = 'certified' | 'in-progress' | 'overdue';

/** One piece of evidence a scan surfaced on the device — a file, a folder, a data type. */
export type PiiFinding = { label: string; isSensitive: boolean };

export type DeviceRecord = {
  personId: string;
  deviceId: string;
  os: 'macOS' | 'Windows 11' | 'Windows 10' | 'Ubuntu';
  agentStatus: AgentStatus;
  agentVersion: string;
  hasPii: boolean;
  piiFindings: readonly PiiFinding[];
  lastScanAt: string;
  /** What the last scan covered — empty once an agent has never checked in. */
  lastScanLocation: string;
  awarenessStatus: AwarenessStatus;
  awarenessPercent: number;
};

/** Cycled across scanned devices — mirrors the prototype's scan-coverage subtitle. */
const SCAN_LOCATIONS: readonly string[] = [
  'Downloads, Desktop',
  'Full profile scan',
  'Documents',
  'Projects folder',
  'Desktop, Docs',
];

/** Cycled across the 8 PII-flagged devices — mirrors the prototype's evidence chips. */
const PII_FINDING_POOL: readonly (readonly PiiFinding[])[] = [
  [
    { label: 'salary_bands.xlsx', isSensitive: true },
    { label: 'offer_letters/ · 6 PDF', isSensitive: false },
  ],
  [
    { label: 'uat_users.csv', isSensitive: false },
    { label: 'Email, Phone', isSensitive: false },
  ],
  [{ label: 'kyc_screens/ · PAN', isSensitive: true }],
  [
    { label: 'training_set.csv', isSensitive: true },
    { label: 'kyc_samples/ · 40 imgs', isSensitive: false },
  ],
  [{ label: 'prod_dump_masked.sql', isSensitive: false }],
  [{ label: 'client_contracts/ · 12 PDF', isSensitive: false }],
  [{ label: 'aadhaar_scans/ · 3 imgs', isSensitive: true }],
  [{ label: 'expense_reports.xlsx', isSensitive: false }],
];

const OS_OPTIONS: DeviceRecord['os'][] = ['macOS', 'Windows 11', 'Windows 10', 'Ubuntu'];
const DEVICE_PREFIX: Record<DeviceRecord['os'], string> = {
  macOS: 'MBP',
  'Windows 11': 'LT',
  'Windows 10': 'LT',
  Ubuntu: 'UBN',
};

/** 5 of 45 devices pending/outdated, split across both states — matches the prototype's KPI. */
function agentStatusFor(index: number): AgentStatus {
  if (index % 9 === 4) return index % 18 === 4 ? 'not-installed' : 'outdated';
  return 'active';
}

function awarenessStatusFor(index: number): AwarenessStatus {
  if (index % 9 === 0) return 'overdue';
  if (index % 5 === 0) return 'in-progress';
  return 'certified';
}

function buildDevices(): DeviceRecord[] {
  let findingIndex = 0;
  return PEOPLE.map((person, index) => {
    const os = OS_OPTIONS[index % OS_OPTIONS.length] ?? 'macOS';
    const agentStatus = agentStatusFor(index);
    const awarenessStatus = awarenessStatusFor(index);
    // 8 of 45 devices flagged with PII findings — matches the prototype's KPI.
    const hasPii = index % 6 === 0;
    const piiFindings = hasPii
      ? (PII_FINDING_POOL[findingIndex++ % PII_FINDING_POOL.length] ?? [])
      : [];
    return {
      personId: person.id,
      deviceId: `${DEVICE_PREFIX[os]}-${String(1000 + index)}`,
      os,
      agentStatus,
      agentVersion:
        agentStatus === 'not-installed' ? '—' : agentStatus === 'outdated' ? 'v2.1' : 'v2.4',
      hasPii,
      piiFindings,
      lastScanAt: agentStatus === 'not-installed' ? '—' : '2026-08-30T09:00:00Z',
      lastScanLocation:
        agentStatus === 'not-installed'
          ? ''
          : (SCAN_LOCATIONS[index % SCAN_LOCATIONS.length] ?? ''),
      awarenessStatus,
      awarenessPercent:
        awarenessStatus === 'certified' ? 100 : awarenessStatus === 'in-progress' ? 60 : 20,
    };
  });
}

export const DEVICES: DeviceRecord[] = buildDevices();

export function getDeviceFor(personId: string): DeviceRecord | undefined {
  return DEVICES.find((device) => device.personId === personId);
}
