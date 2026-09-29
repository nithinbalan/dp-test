'use client';

/**
 * One source, in four tabs.
 *
 * Reads from the mock store rather than from server props: connecting,
 * disconnecting and scanning all happen here, and the register the user goes
 * back to has to reflect them. That also means a source added by the wizard
 * resolves here — the server render has only the seed.
 */
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import NextLink from 'next/link';
import { ArrowLeft, FlaskConical, Plug, Radar, Settings, ShieldCheck } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Heading } from '@atoms/Heading';
import { Progress } from '@atoms/Progress';
import { Text } from '@atoms/Text';
import { Alert } from '@molecules/Alert';
import { EmptyState } from '@molecules/EmptyState';
import { Tabs, tabPanelProps } from '@molecules/Tabs';
import { useToast } from '@shared/hooks';
import { getConnector } from '@shared/mock/connectors';
import { findSource, type DataSource } from '@shared/mock/data-sources';
import { patchSource } from '@shared/mock/data-sources-store';
import { getSourceDetail, type ScanRun, type SourceDetailData } from '@shared/mock/source-details';
import { formatMessage } from '../format-message';
import { useDataSources } from '../use-data-sources';
import { useSourceScans } from '../use-source-scans';
import { ConfigPanel, type ScanSettings } from './ConfigPanel';
import { FindingsPanel } from './FindingsPanel';
import { HistoryPanel } from './HistoryPanel';
import { OverviewPanel } from './OverviewPanel';
import type { SourceDetailMessages } from './SourceDetail.types';

const ID_PREFIX = 'source-detail';
const SIMULATED_LATENCY_MS = 900;

const DEFAULT_SETTINGS: ScanSettings = {
  sampling: 'standard',
  schedule: 'daily',
  detectors: ['aadhaar', 'pan', 'gstin', 'phone', 'email', 'bank', 'address', 'dob'],
  excludedScope: [],
};

function BackLink({ label }: { label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="w-fit">
      <NextLink href="/data-sources" className="flex items-center gap-1.5">
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {label}
      </NextLink>
    </Button>
  );
}

/**
 * Resolves the source from the register, or says plainly that it is gone —
 * disconnecting from the configuration tab can remove the row under you.
 */
export function SourceDetail({
  sourceId,
  messages: t,
}: {
  sourceId: string;
  messages: SourceDetailMessages;
}) {
  const sources = useDataSources();
  const source = findSource(sources, sourceId);

  if (!source) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink label={t.backLabel} />
        <EmptyState label={t.notFoundTitle} description={t.notFoundDescription} />
      </div>
    );
  }
  return <SourceDetailView source={source} messages={t} />;
}

/** The open-findings count rides on the tab, so it is visible without opening it. */
function buildTabs(t: SourceDetailMessages, openCount: number) {
  return [
    { value: 'overview', label: t.overviewTab },
    {
      value: 'findings',
      label: t.findingsTab,
      endSlot:
        openCount > 0 ? (
          <Badge size="xs" tone="danger">
            {formatMessage(t.openCount, { count: openCount })}
          </Badge>
        ) : undefined,
    },
    { value: 'history', label: t.historyTab },
    { value: 'configuration', label: t.configTab },
  ];
}

function SourceDetailView({
  source,
  messages: t,
}: {
  source: DataSource;
  messages: SourceDetailMessages;
}) {
  const { runs, startScan, connect } = useSourceScans();
  const [tab, setTab] = useState('overview');
  const [settings, setSettings] = useState<ScanSettings>(DEFAULT_SETTINGS);
  const [manualRuns, setManualRuns] = useState<readonly ScanRun[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const detail = useMemo(() => getSourceDetail(source), [source]);
  const run = runs[source.id];
  const openCount = detail.findings.filter((finding) => finding.status === 'open').length;
  const history = [...manualRuns, ...detail.history];

  const openConfigTab = () => {
    setTab('configuration');
  };
  const actions = useDetailActions({
    source,
    t,
    startScan,
    connect,
    setTab,
    setManualRuns,
    setIsTesting,
  });

  return (
    <div className="flex flex-col gap-6">
      <BackLink label={t.backLabel} />

      <DetailHeader
        source={source}
        t={t}
        isRunning={run !== undefined}
        onScan={actions.scan}
        onConnect={actions.connect}
        onConfigure={openConfigTab}
      />

      {run ? (
        <Progress value={run.progress} label={t.scanProgressLabel} size="sm" tone="brand" />
      ) : null}
      <DetailBanners source={source} detail={detail} t={t} onConnectTab={openConfigTab} />

      <Tabs
        label={t.tabsLabel}
        items={buildTabs(t, openCount)}
        value={tab}
        onValueChange={setTab}
        idPrefix={ID_PREFIX}
      />

      <DetailPanels
        source={source}
        detail={detail}
        history={history}
        tab={tab}
        t={t}
        settings={settings}
        isConnecting={run !== undefined}
        isTesting={isTesting}
        onSettingsChange={(patch) => {
          setSettings((current) => ({ ...current, ...patch }));
        }}
        onTest={actions.test}
        onSave={actions.save}
        onConnect={actions.connect}
        onDisconnect={actions.disconnect}
        onOpenExternal={actions.openExternal}
        onDownloadReport={actions.downloadReport}
      />
    </div>
  );
}

function HeaderActions({
  source,
  t,
  isRunning,
  onScan,
  onConnect,
  onConfigure,
}: {
  source: DataSource;
  t: SourceDetailMessages;
  isRunning: boolean;
  onScan: () => void;
  onConnect: () => void;
  onConfigure: () => void;
}) {
  if (source.status === 'off') {
    return (
      <Button
        tone="brand"
        isLoading={isRunning}
        startSlot={<Plug className="size-4" />}
        onClick={onConnect}
      >
        {isRunning ? t.connectingLabel : t.connectCta}
      </Button>
    );
  }
  return (
    <>
      <Button
        variant="outline"
        isLoading={isRunning}
        startSlot={<Radar className="size-4" />}
        onClick={onScan}
      >
        {isRunning ? t.scanningLabel : t.scanNowCta}
      </Button>
      <Button tone="brand" startSlot={<Settings className="size-4" />} onClick={onConfigure}>
        {t.configureCta}
      </Button>
    </>
  );
}

function DetailHeader({
  source,
  t,
  isRunning,
  onScan,
  onConnect,
  onConfigure,
}: {
  source: DataSource;
  t: SourceDetailMessages;
  isRunning: boolean;
  onScan: () => void;
  onConnect: () => void;
  onConfigure: () => void;
}) {
  const connector = getConnector(source.connectorId);
  const isOff = source.status === 'off';
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Avatar
        label={source.name}
        initials={connector?.mark ?? source.name.slice(0, 1)}
        shape="rounded"
        size="lg"
        tone="brand"
      />
      <div className="min-w-0 flex-1">
        <Heading level={1} size="xl">
          {source.name}
        </Heading>
        <Text size="sm" tone="muted">
          {source.description}
        </Text>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={isOff ? 'neutral' : 'success'} size="xs">
            {isOff ? t.connStatusOff : t.connStatusConnected}
          </Badge>
          {source.categories.map((category) => (
            <Badge
              key={category.label}
              size="xs"
              variant="outline"
              tone={category.isSensitive ? 'danger' : 'neutral'}
            >
              {category.label}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <HeaderActions
          source={source}
          t={t}
          isRunning={isRunning}
          onScan={onScan}
          onConnect={onConnect}
          onConfigure={onConfigure}
        />
      </div>
    </div>
  );
}

function DetailPanels({
  source,
  detail,
  history,
  tab,
  t,
  settings,
  isConnecting,
  isTesting,
  onSettingsChange,
  onTest,
  onSave,
  onConnect,
  onDisconnect,
  onOpenExternal,
  onDownloadReport,
}: {
  source: DataSource;
  detail: SourceDetailData;
  history: readonly ScanRun[];
  tab: string;
  t: SourceDetailMessages;
  settings: ScanSettings;
  isConnecting: boolean;
  isTesting: boolean;
  onSettingsChange: (patch: Partial<ScanSettings>) => void;
  onTest: () => void;
  onSave: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenExternal: (location: string) => void;
  onDownloadReport: () => void;
}) {
  return (
    <>
      <div {...tabPanelProps(ID_PREFIX, 'overview')} hidden={tab !== 'overview'}>
        <OverviewPanel stats={detail.stats} t={t} />
      </div>
      <div {...tabPanelProps(ID_PREFIX, 'findings')} hidden={tab !== 'findings'}>
        <FindingsPanel
          findings={detail.findings}
          isSample={detail.isSample}
          sourceName={source.name}
          t={t}
          onOpenExternal={onOpenExternal}
        />
      </div>
      <div {...tabPanelProps(ID_PREFIX, 'history')} hidden={tab !== 'history'}>
        <HistoryPanel history={history} t={t} onDownloadReport={onDownloadReport} />
      </div>
      <div {...tabPanelProps(ID_PREFIX, 'configuration')} hidden={tab !== 'configuration'}>
        <ConfigPanel
          source={source}
          config={detail.config}
          settings={settings}
          t={t}
          isConnecting={isConnecting}
          isTesting={isTesting}
          onSettingsChange={onSettingsChange}
          onTest={onTest}
          onSave={onSave}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </>
  );
}

/** The zero-copy promise, and the warning when the rows below are not real data. */
function DetailBanners({
  source,
  detail,
  t,
  onConnectTab,
}: {
  source: DataSource;
  detail: SourceDetailData;
  t: SourceDetailMessages;
  onConnectTab: () => void;
}) {
  return (
    <>
      <Alert
        tone="info"
        variant="soft"
        label={t.zeroCopyTitle}
        description={formatMessage(t.zeroCopyDescription, { name: source.name })}
        startSlot={<ShieldCheck className="size-4" />}
        endSlot={
          <Badge size="xs" variant="outline">
            {t.zeroCopyTag}
          </Badge>
        }
      />
      {detail.isSample ? (
        <Alert
          tone="warning"
          variant="outline"
          label={t.sampleTitle}
          description={detail.sampleNote ?? t.sampleDescription}
          startSlot={<FlaskConical className="size-4" />}
          endSlot={
            <Button size="sm" tone="brand" onClick={onConnectTab}>
              {t.sampleCta}
            </Button>
          }
        />
      ) : null}
    </>
  );
}

/**
 * The three things this screen can do to a source. Split out of the view so the
 * component reads as layout: what each one writes back to the register is the
 * part worth reading on its own.
 */
function useDetailActions({
  source,
  t,
  startScan,
  connect,
  setTab,
  setManualRuns,
  setIsTesting,
}: {
  source: DataSource;
  t: SourceDetailMessages;
  startScan: (source: DataSource) => void;
  connect: (source: DataSource) => void;
  setTab: (tab: string) => void;
  setManualRuns: Dispatch<SetStateAction<readonly ScanRun[]>>;
  setIsTesting: Dispatch<SetStateAction<boolean>>;
}) {
  const toast = useToast();
  return {
    scan: () => {
      startScan(source);
      setManualRuns((current) => [
        {
          id: `manual-${String(Date.now())}`,
          when: 'Just now',
          time: 'manual',
          type: 'MANUAL',
          duration: '3m 58s',
          items: source.lastScanDetail,
          delta: '+0 new',
          isDeltaZero: true,
          status: 'complete' as const,
        },
        ...current,
      ]);
      setTab('history');
      toast.show({ label: t.toastScanComplete, tone: 'info' });
    },
    connect: () => {
      connect(source);
      setTab('findings');
      toast.show({
        label: formatMessage(t.toastConnected, { name: source.name }),
        tone: 'info',
      });
    },
    save: () => {
      toast.show({ label: t.toastConfigSaved, tone: 'success' });
    },
    downloadReport: () => {
      toast.show({ label: t.toastScanReport, tone: 'info' });
    },
    openExternal: (location: string) => {
      toast.show({
        label: formatMessage(t.toastOpenExternal, { location, name: source.name }),
        tone: 'info',
      });
    },
    test: () => {
      setIsTesting(true);
      window.setTimeout(() => {
        setIsTesting(false);
        toast.show({ label: t.toastTestOk, tone: 'success' });
      }, SIMULATED_LATENCY_MS);
    },
    /** Keeps the scan log, but drops the findings — they described a live connection. */
    disconnect: () => {
      patchSource(source.id, {
        status: 'off',
        pii: 'na',
        categories: [],
        lastScanLabel: 'Never',
        lastScanDetail: 'No scans yet',
      });
      toast.show({
        label: formatMessage(t.toastDisconnected, { name: source.name }),
        tone: 'warning',
      });
    },
  };
}
