'use client';

import { Radar } from 'lucide-react';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import { formatMessage } from '../format-message';
import {
  ALL_DETECTORS,
  SENSITIVE_DETECTORS,
  type AddSourceMessages,
  type AddSourceState,
  type DetectorId,
  type SamplingDepth,
  type ScanSchedule,
} from './AddSourceWizard.types';

function Panel({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="outline" size="none" className="flex flex-col gap-3 p-4">
      <div>
        <Text as="span" size="sm" weight="semibold" className="block">
          {label}
        </Text>
        <Text as="span" size="xs" tone="muted" className="block">
          {description}
        </Text>
      </div>
      {children}
    </Card>
  );
}

function OptionCard({
  label,
  hint,
  isSelected,
  onClick,
}: {
  label: string;
  hint: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        'border-border-default bg-bg-surface rounded-control hover:border-brand-fg border p-3 text-start transition-colors',
        isSelected && 'border-brand-fg bg-brand-subtle',
      )}
    >
      <Text as="span" size="sm" weight="semibold" className="block">
        {label}
      </Text>
      <Text as="span" size="xs" tone="muted" className="block">
        {hint}
      </Text>
    </button>
  );
}

function ChoicePanel<T extends SamplingDepth | ScanSchedule>({
  label,
  description,
  items,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  items: readonly { value: T; label: string; hint: string }[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  return (
    <Panel label={label} description={description}>
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((item) => (
          <OptionCard
            key={item.value}
            {...item}
            isSelected={value === item.value}
            onClick={() => {
              onValueChange(item.value);
            }}
          />
        ))}
      </div>
    </Panel>
  );
}

function ScanStepHeader({ t, connectorName }: { t: AddSourceMessages; connectorName: string }) {
  return (
    <div className="mb-1 flex items-start gap-3">
      <span className="border-border-default bg-bg-surface text-brand-fg rounded-control grid size-11 shrink-0 place-items-center border">
        <Radar className="size-5" />
      </span>
      <div>
        <Heading level={2} size="xl" className="mb-0.5">
          {t.scanTitle}
        </Heading>
        <Text size="sm" tone="muted">
          {formatMessage(t.scanDescription, { name: connectorName })}
        </Text>
      </div>
    </div>
  );
}

function DetectorsPanel({
  t,
  detectors,
  onChange,
}: {
  t: AddSourceMessages;
  detectors: readonly DetectorId[];
  onChange: (detectors: DetectorId[]) => void;
}) {
  return (
    <Panel label={t.detectorsTitle} description={t.detectorsDescription}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ALL_DETECTORS.map((detector) => {
          const isChecked = detectors.includes(detector);
          return (
            <label
              key={detector}
              className={cn(
                'border-border-default bg-bg-surface rounded-control flex cursor-pointer items-center gap-2 border px-2.5 py-2 text-xs',
                SENSITIVE_DETECTORS.includes(detector) && 'border-danger-solid bg-danger-subtle',
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...detectors, detector]
                    : detectors.filter((item) => item !== detector);
                  onChange(next);
                }}
                className="accent-brand-solid"
              />
              {t.detectorNames[detector]}
            </label>
          );
        })}
      </div>
    </Panel>
  );
}

export function ScanStep({
  connectorName,
  state,
  t,
  onChange,
}: {
  connectorName: string;
  state: AddSourceState;
  t: AddSourceMessages;
  onChange: (patch: Partial<AddSourceState>) => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <ScanStepHeader t={t} connectorName={connectorName} />
      <ChoicePanel
        label={t.samplingTitle}
        description={t.samplingDescription}
        value={state.sampling}
        onValueChange={(sampling) => {
          onChange({ sampling });
        }}
        items={[
          { value: 'quick', label: t.samplingQuick, hint: t.samplingQuickHint },
          { value: 'standard', label: t.samplingStandard, hint: t.samplingStandardHint },
          { value: 'deep', label: t.samplingDeep, hint: t.samplingDeepHint },
        ]}
      />
      <ChoicePanel
        label={t.scheduleTitle}
        description={t.scheduleDescription}
        value={state.schedule}
        onValueChange={(schedule) => {
          onChange({ schedule });
        }}
        items={[
          { value: 'daily', label: t.scheduleDaily, hint: t.scheduleDailyHint },
          { value: 'weekly', label: t.scheduleWeekly, hint: t.scheduleWeeklyHint },
          { value: 'manual', label: t.scheduleManual, hint: t.scheduleManualHint },
        ]}
      />
      <DetectorsPanel
        t={t}
        detectors={state.detectors}
        onChange={(detectors) => {
          onChange({ detectors });
        }}
      />
    </div>
  );
}
