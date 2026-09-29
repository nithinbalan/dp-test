/**
 * MOCK DATA — what one source's detail screen shows: headline statistics, the
 * PII findings a scan located, the scan log, and the connection configuration.
 *
 * Statistics are keyed (`kind`) rather than carrying their own English caption,
 * and risk is a level rather than the word "HIGH", so the panel resolves both
 * from the message catalogue. The free text that stays here — a bucket prefix, a
 * masked sample, "+2 new · SUPPORT" — is scan output, not product vocabulary: it
 * would arrive from the scanner in the same language whatever the reader's is.
 */
import type { DataSource, PiiCategory } from './data-sources';
import { SOURCE_DETAIL_CATALOGUE } from './source-detail-catalogue';

export type SourceStatKind =
  'piiTypes' | 'itemsWithPii' | 'locations' | 'riskLevel' | 'lastScan' | 'discovered';

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown';

export type SourceStat = {
  kind: SourceStatKind;
  /** Already-formatted display value: "214", "1.1L", "—". */
  value: string;
  /** Set instead of `value` when the stat is a risk rating. */
  risk?: RiskLevel | undefined;
  /** Scan-supplied qualifier under the caption, e.g. "of 3,412 scanned". */
  note?: string | undefined;
};

export type FindingStatus = 'open' | 'acknowledged' | 'sample';

export type SourceFinding = {
  id: string;
  /** Where the identifiers are, e.g. "SUPPORT · Issue descriptions". */
  location: string;
  locationDetail: string;
  identifiers: readonly PiiCategory[];
  items: string;
  confidence: string;
  maskedSample: string;
  status: FindingStatus;
};

export type ScanRunStatus = 'complete' | 'partial';

export type ScanRun = {
  id: string;
  when: string;
  time: string;
  type: string;
  duration: string;
  items: string;
  delta: string;
  /** Nothing new — rendered quietly, so a real delta stands out. */
  isDeltaZero: boolean;
  status: ScanRunStatus;
};

/** One includable/excludable unit of scan scope — a Jira project, an S3 prefix. */
export type ScopeItem = { name: string; isIncluded: boolean };

export type SourceConfig = {
  url: string;
  account: string;
  auth: string;
  /** What the scope items ARE, e.g. "projects", "databases". */
  scopeLabel: string;
  scope: readonly ScopeItem[];
};

export type SourceDetailData = {
  /**
   * True when nothing has been scanned and the screen is showing an illustrative
   * shape instead. It must be labelled as such — a sample the reader mistakes for
   * their own findings is worse than an empty screen.
   */
  isSample: boolean;
  sampleNote?: string | undefined;
  stats: readonly SourceStat[];
  findings: readonly SourceFinding[];
  history: readonly ScanRun[];
  config: SourceConfig;
};

function riskFor(source: DataSource): RiskLevel {
  if (source.pii === 'risk') return 'high';
  if (source.pii === 'yes') return 'medium';
  if (source.pii === 'no') return 'low';
  return 'unknown';
}

/**
 * Detail for a source the catalogue has no hand-written entry for — anything the
 * user connects through the wizard. Derived from what the row already knows, so a
 * freshly connected source opens on a real screen rather than an empty one.
 */
function genericDetail(source: DataSource): SourceDetailData {
  const location = source.description.split(' · ')[0] ?? source.description;
  return {
    isSample: false,
    stats: [
      { kind: 'piiTypes', value: String(source.categories.length) },
      { kind: 'locations', value: '1' },
      { kind: 'riskLevel', value: '', risk: riskFor(source) },
      { kind: 'lastScan', value: source.lastScanLabel, note: source.lastScanDetail },
    ],
    findings: source.categories.map((identifier, index) => ({
      id: `${source.id}-f${String(index)}`,
      location: source.name,
      locationDetail: `${location} · auto-detected`,
      identifiers: [identifier],
      items: '—',
      confidence: '95%',
      maskedSample: 'masked',
      status: 'acknowledged',
    })),
    history: [
      {
        id: `${source.id}-h0`,
        when: source.lastScanLabel,
        time: 'scheduled',
        type: 'SCHEDULED',
        duration: '—',
        items: source.lastScanDetail,
        delta: '+0 new',
        isDeltaZero: true,
        status: 'complete',
      },
    ],
    config: { url: '—', account: '—', auth: 'Read-only credentials', scopeLabel: '', scope: [] },
  };
}

/**
 * A source that has never been scanned has no findings to show, so it gets the
 * catalogue's illustrative sample where one exists — flagged `isSample` so the
 * screen can say plainly that the rows are not the reader's data.
 */
export function getSourceDetail(source: DataSource): SourceDetailData {
  const entry = SOURCE_DETAIL_CATALOGUE[source.id];
  if (!entry) return genericDetail(source);
  if (source.status === 'connected') return entry;
  return { ...entry, isSample: true };
}
