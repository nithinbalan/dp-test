'use client';

/**
 * The cells a source row is made of, shared by the tree and the table view.
 *
 * They live in one file because the two views are the same information at two
 * densities — if the PII tag drifted between them, the register would tell you
 * two different things about one source depending on which button you pressed
 * last.
 */
import NextLink from 'next/link';
import { CheckCircle2, Radar, ShieldAlert } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Badge } from '@atoms/Badge';
import { Progress } from '@atoms/Progress';
import { Text } from '@atoms/Text';
import { getConnector } from '@shared/mock/connectors';
import type { DataSource, SourcePii } from '@shared/mock/data-sources';
import type { DataSourcesMessages } from './DataSourcesMessages';
import { formatMessage } from './format-message';
import type { ScanRunState } from './use-source-scans';

/** `risk` earns danger; `yes` is expected-but-notable; `na` is not a finding. */
const PII_TONES: Record<SourcePii, 'danger' | 'warning' | 'success' | 'neutral'> = {
  risk: 'danger',
  yes: 'warning',
  no: 'success',
  na: 'neutral',
};

export function SourceLogo({ source, size = 'sm' }: { source: DataSource; size?: 'xs' | 'sm' }) {
  const connector = getConnector(source.connectorId);
  return (
    /*
     * .ar-logo: 42x42, border-radius:10px, border:1px solid var(--line), bg:#fff, overflow:hidden
     * .ar-row.child .ar-logo: 34x34, border-radius:8px
     */
    <Avatar
      label={source.name}
      initials={connector?.mark ?? source.name.slice(0, 1)}
      shape="rounded"
      size={size === 'xs' ? 'md' : 'lg'}
      tone="brand"
    />
  );
}

export function SourceName({
  source,
  subline,
}: {
  source: DataSource;
  subline?: string | undefined;
}) {
  /*
   * .ar-name b: 14px, display:block, line-height:1.25, truncated
   * .ar-name small: 11.5px, ink-soft, display:block, truncated
   */
  return (
    <div className="min-w-0">
      <NextLink href={`/data-sources/${source.id}`} className="hover:underline">
        <Text as="span" weight="bold" isTruncated className="block text-sm leading-tight">
          {source.name}
        </Text>
      </NextLink>
      <Text as="span" size="xs" tone="muted" isTruncated className="block">
        {subline ?? source.description}
      </Text>
    </div>
  );
}

export function ConnectionBadge({ source, t }: { source: DataSource; t: DataSourcesMessages }) {
  const isConnected = source.status === 'connected';
  /*
   * .ar-conn: inline-flex, gap:6px, mono, 10.5px, py:5px px:11px, border-radius:999px
   * .ar-conn.ok: green-soft bg, green color
   * .ar-conn.off: #F0EFE8 bg, ink-soft color
   * .dot: 6x6, rounded-full, currentColor bg
   */
  return (
    <Badge
      tone={isConnected ? 'brand' : 'neutral'}
      variant="soft"
      size="xs"
      startSlot={<span className="me-1 inline-block size-1.5 rounded-full bg-current" />}
    >
      {isConnected ? t.connStatusConnected : t.connStatusOff}
    </Badge>
  );
}

function piiLabel(source: DataSource, t: DataSourcesMessages): string {
  if (source.pii === 'na') return t.piiNotScanned;
  if (source.categories.length === 0) return t.piiNone;
  if (source.categories.length === 1) return t.piiOneTypeFound;
  return formatMessage(t.piiTypesFound, { count: source.categories.length });
}

function PiiIcon({ pii }: { pii: SourcePii }) {
  if (pii === 'risk' || pii === 'yes') {
    return <ShieldAlert className="me-1 inline-block size-3 text-current" />;
  }
  if (pii === 'no') {
    return <CheckCircle2 className="me-1 inline-block size-3 text-current" />;
  }
  return null;
}

/**
 * The PII verdict plus the identifier types behind it.
 * Prototype .ar-pii: flex, flex-col, gap:6px
 * .ar-tag: inline-flex, gap:6px, mono, 10.5px, py:5px px:11px, pill, align-self:flex-start
 * .ar-cat / .ar-cats: flex-wrap chips, 10.5px, font-600, cream bg, border, 6px radius
 * .ar-tag.risk → red-soft/red; .ar-tag.found → orange-soft/orange; .ar-tag.clean → green-soft/green; .ar-tag.na → cream/ink-soft
 */
export function PiiCell({
  source,
  t,
  isScanning,
}: {
  source: DataSource;
  t: DataSourcesMessages;
  isScanning: boolean;
}) {
  if (isScanning) {
    return (
      <Badge tone="info" variant="soft" size="xs">
        {t.piiScanning}
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Badge
        tone={PII_TONES[source.pii]}
        variant="soft"
        size="xs"
        startSlot={<PiiIcon pii={source.pii} />}
      >
        {piiLabel(source, t)}
      </Badge>
      {source.categories.length > 0 ? (
        /* .ar-cats: flex-wrap, gap:5px */
        <div className="flex flex-wrap items-center gap-1">
          {source.categories.map((category) => (
            /* .ar-cat: 10.5px, font-600, cream bg, border, 6px radius, px:8 py:2 */
            /* .ar-cat.hot: red-soft bg, red color */
            <Badge
              key={category.label}
              variant="outline"
              size="xs"
              tone={category.isSensitive ? 'danger' : 'neutral'}
              className={
                category.isSensitive
                  ? 'bg-danger-subtle text-danger-fg border-danger-subtle'
                  : 'bg-bg-canvas'
              }
            >
              {category.label}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * When and how the source was last scanned — or, while a run is in flight, the
 * progress bar.
 * Prototype .ar-scan: 11.5px, ink-soft
 * .ar-scan b: 12.5px, ink color, font-600, display:block, truncated
 * .ar-prog: 6px height, bg:#EDECe4, border-radius:99px, overflow:hidden, mt:6px, w:110px
 */
export function LastScanCell({
  source,
  t,
  run,
}: {
  source: DataSource;
  t: DataSourcesMessages;
  run: ScanRunState | undefined;
}) {
  if (run) {
    return (
      <div className="flex min-w-32 flex-col gap-1">
        <Text as="span" size="xs" weight="medium">
          {run.phase === 'connecting' ? t.firstScanLabel : t.scanningLabel}
        </Text>
        <Progress
          value={run.progress}
          label={t.scanProgressLabel}
          size="sm"
          tone="brand"
          className="w-full"
        />
      </div>
    );
  }
  return (
    /* .ar-scan: 11.5px, ink-soft, overflow:hidden */
    <div className="min-w-0">
      <Text as="span" size="xs" weight="medium" isTruncated className="block">
        {source.lastScanLabel}
      </Text>
      <Text as="span" size="xs" tone="muted" isTruncated className="block">
        {source.lastScanDetail}
      </Text>
    </div>
  );
}

export function ScanIcon() {
  return <Radar className="size-4" />;
}
