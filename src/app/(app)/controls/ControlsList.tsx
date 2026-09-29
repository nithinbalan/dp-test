'use client';

/** Owns search/filter state for the populated Controls · CCM register. */
import { useMemo, useState } from 'react';
import { ShieldQuestion } from 'lucide-react';
import { Card } from '@atoms/Card';
import { Input } from '@atoms/Input';
import { Select, type SelectOption } from '@atoms/Select';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { ScoreRing } from '@molecules/ScoreRing';
import { StatCard } from '@molecules/StatCard';
import type { Control } from '@shared/mock/controls';
import { ControlsTable } from './ControlsTable';
import type { ControlsMessages } from './ControlsMessages';

const BAND_TONES = { strong: 'success', developing: 'warning', 'at-risk': 'danger' } as const;
type ControlsBand = keyof typeof BAND_TONES;

/** This register's own 3-tier control-coverage band — distinct from Gap
 * Assessment's 4-tier readiness band (`@shared/mock/assessment`'s `scoreBand`),
 * which measures statutory obligation coverage, not control implementation. */
function controlsBand(score: number): ControlsBand {
  if (score >= 80) return 'strong';
  if (score >= 50) return 'developing';
  return 'at-risk';
}

function bandLabel(t: ControlsMessages, band: ControlsBand): string {
  if (band === 'strong') return t.scoreBandStrong;
  if (band === 'developing') return t.scoreBandDeveloping;
  return t.scoreBandAtRisk;
}

function Hero({ t, overall }: { t: ControlsMessages; overall: number }) {
  const band = controlsBand(overall);
  return (
    <Card variant="soft" className="flex flex-wrap items-center gap-6">
      <ScoreRing
        value={overall}
        label={t.overallScoreLabel}
        description={bandLabel(t, band)}
        tone={BAND_TONES[band]}
        size="xl"
      />
    </Card>
  );
}

function FilterRow({
  t,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
}: {
  t: ControlsMessages;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}) {
  const statusOptions: SelectOption[] = [
    { value: 'all', label: t.statusAll },
    { value: 'pass', label: t.statusPass },
    { value: 'fail', label: t.statusFail },
    { value: 'pending', label: t.statusPending },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
        placeholder={t.searchPlaceholder}
        className="min-w-56"
      />
      <Select
        options={statusOptions}
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        aria-label={t.statusFilterLabel}
      />
    </div>
  );
}

export function ControlsList({
  controls,
  pageLabel,
  pageRefTag,
  pageDescription,
  overall,
  passingCount,
  failingCount,
  pendingCount,
  t,
}: {
  controls: readonly Control[];
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  overall: number;
  passingCount: number;
  failingCount: number;
  pendingCount: number;
  t: ControlsMessages;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(
    () =>
      controls.filter(
        (control) =>
          control.title.toLowerCase().includes(query.toLowerCase()) &&
          (statusFilter === 'all' || control.status === statusFilter),
      ),
    [controls, query, statusFilter],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />
      <Hero t={t} overall={overall} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.kpiTotal} value={controls.length} />
        <StatCard label={t.kpiPassing} value={passingCount} tone="success" />
        <StatCard label={t.kpiFailing} value={failingCount} tone="danger" />
        <StatCard label={t.kpiPending} value={pendingCount} tone="warning" />
      </div>

      <FilterRow
        t={t}
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          label={t.searchPlaceholder}
          variant="ghost"
          startSlot={<ShieldQuestion className="size-6" />}
        />
      ) : (
        <ControlsTable t={t} rows={filtered} />
      )}
    </div>
  );
}
