'use client';

/**
 * Step 4 — everything the wizard is about to do, on one screen, before it does
 * it. The first scan starts the moment this is confirmed, so this is the last
 * point at which a wrong host or an over-broad scope is cheap to fix.
 */
import { ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { Alert } from '@molecules/Alert';
import type { Connector } from '@shared/mock/connectors';
import { formatMessage } from '../format-message';
import {
  ALL_DETECTORS,
  DB_FIELD,
  type AddSourceMessages,
  type AddSourceState,
} from './AddSourceWizard.types';

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border-default flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text size="sm" weight="medium" className="text-end">
        {value}
      </Text>
    </div>
  );
}

/**
 * The one value that says WHERE this connection points. Which field carries it
 * differs per connector, so the first non-empty required text input stands in —
 * it is the field the connector itself marked as the thing you must supply.
 */
export function connectionTarget(connector: Connector, state: AddSourceState): string {
  const host = state.values[DB_FIELD.host];
  if (connector.category === 'db') return host === undefined || host === '' ? '—' : host;
  for (const field of connector.fields) {
    if (!field.isRequired || field.control === 'password') continue;
    const value = state.values[field.key];
    if (value !== undefined && value !== '') return value;
  }
  return '—';
}

function databaseSummary(
  connector: Connector,
  state: AddSourceState,
  t: AddSourceMessages,
): string | undefined {
  if (connector.category !== 'db') return undefined;
  if (state.databaseMode === 'all' || !state.areDatabasesLoaded) return t.reviewDatabasesAll;
  if (state.selectedDatabases.length === 0) return t.reviewDatabasesNone;
  return state.selectedDatabases.join(', ');
}

export function ReviewStep({
  connector,
  state,
  t,
}: {
  connector: Connector;
  state: AddSourceState;
  t: AddSourceMessages;
}) {
  const samplingLabels = {
    quick: t.samplingQuick,
    standard: t.samplingStandard,
    deep: t.samplingDeep,
  };
  const scheduleLabels = {
    daily: t.scheduleDaily,
    weekly: t.scheduleWeekly,
    manual: t.scheduleManual,
  };
  const databases = databaseSummary(connector, state, t);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="bg-bg-brand-subtle text-brand-fg flex size-9 shrink-0 items-center justify-center rounded-md">
          <ClipboardCheck className="size-5" />
        </span>
        <div>
          <Heading level={2} size="lg">
            {t.reviewTitle}
          </Heading>
          <Text size="sm" tone="muted">
            {t.reviewDescription}
          </Text>
        </div>
      </div>

      <Card variant="outline" size="md">
        <ReviewRow label={t.reviewConnector} value={connector.name} />
        <ReviewRow label={t.reviewTarget} value={connectionTarget(connector, state)} />
        {databases === undefined ? null : <ReviewRow label={t.reviewDatabases} value={databases} />}
        <ReviewRow label={t.reviewSampling} value={samplingLabels[state.sampling]} />
        <ReviewRow label={t.reviewSchedule} value={scheduleLabels[state.schedule]} />
        <ReviewRow
          label={t.reviewDetectors}
          value={formatMessage(t.reviewDetectorCount, {
            on: state.detectors.length,
            total: ALL_DETECTORS.length,
          })}
        />
        <ReviewRow
          label={t.reviewCredentials}
          value={state.shouldSaveCredentials ? t.credentialsSaved : t.credentialsNotStored}
        />
      </Card>

      <Alert
        tone="success"
        variant="soft"
        label={t.readOnlyAccessLabel}
        description={t.readOnlyAccessDescription}
        startSlot={<ShieldCheck className="size-4" />}
      />
    </div>
  );
}
