'use client';

/**
 * The connection, what the scanner is allowed to touch, and — for a source that
 * is not connected yet — the button that connects it.
 *
 * "What we store" is a panel rather than a footnote because it is the answer to
 * the question this screen provokes: if you can show me a masked Aadhaar number,
 * where is the real one? Disconnecting sits under it, two clicks deep, since it
 * silently stops every future scan.
 */
import { useState } from 'react';
import { Plug, Rocket, Save, Unplug } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Chip } from '@atoms/Chip';
import { Input } from '@atoms/Input';
import { Text } from '@atoms/Text';
import { Field } from '@molecules/Field';
import { PasswordInput } from '@molecules/PasswordInput';
import { SegmentedControl } from '@molecules/SegmentedControl';
import { TagPicker } from '@molecules/TagPicker';
import type { DataSource } from '@shared/mock/data-sources';
import type { SourceConfig } from '@shared/mock/source-details';
import { ALL_DETECTORS, SENSITIVE_DETECTORS } from '../add/AddSourceWizard.types';
import { formatMessage } from '../format-message';
import type { SourceDetailMessages } from './SourceDetail.types';

export type ScanSettings = {
  sampling: string;
  schedule: string;
  detectors: readonly string[];
  excludedScope: readonly string[];
};

function PanelTitle({ label, description }: { label: string; description?: string }) {
  return (
    <div>
      <Text as="span" weight="medium" className="block">
        {label}
      </Text>
      {description === undefined ? null : (
        <Text as="span" size="xs" tone="muted" className="block">
          {description}
        </Text>
      )}
    </div>
  );
}

function StoreRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'danger' | 'neutral';
}) {
  return (
    <div className="border-border-default flex items-center justify-between border-b py-2 last:border-b-0">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text size="sm" weight="medium" tone={tone}>
        {value}
      </Text>
    </div>
  );
}

/**
 * The editable credentials. Local state only: there is no backend to save them
 * to yet, and pretending otherwise would be worse than the honest placeholder.
 */
function CredentialFields({
  config,
  t,
  isOff,
}: {
  config: SourceConfig;
  t: SourceDetailMessages;
  isOff: boolean;
}) {
  const [url, setUrl] = useState(config.url);
  const [account, setAccount] = useState(config.account);
  const [secret, setSecret] = useState('');

  return (
    <>
      <Field label={t.configUrlLabel}>
        {(control) => (
          <Input
            {...control}
            placeholder={t.configUrlPlaceholder}
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
            }}
            fullWidth
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.configAccountLabel}>
          {(control) => (
            <Input
              {...control}
              placeholder={t.configAccountPlaceholder}
              value={account}
              onChange={(event) => {
                setAccount(event.target.value);
              }}
              fullWidth
            />
          )}
        </Field>
        <PasswordInput
          label={isOff ? t.configSecretOffLabel : t.configSecretLabel}
          value={secret}
          onValueChange={setSecret}
          autoComplete="new-password"
          fullWidth
        />
      </div>
      <Field label={t.configAuthLabel}>
        {(control) => <Input {...control} value={config.auth} isReadOnly fullWidth />}
      </Field>
    </>
  );
}

function ConnectionCard({
  source,
  config,
  t,
  onTest,
  isTesting,
}: {
  source: DataSource;
  config: SourceConfig;
  t: SourceDetailMessages;
  onTest: () => void;
  isTesting: boolean;
}) {
  const isOff = source.status === 'off';

  return (
    <Card variant="outline" size="md" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PanelTitle
          label={t.configConnectionTitle}
          description={isOff ? t.configConnectionOffDescription : t.configConnectionDescription}
        />
        {isOff ? null : (
          <Text as="span" size="xs" tone="success" isMono>
            {t.configReadOnlyVerified}
          </Text>
        )}
      </div>
      <CredentialFields config={config} t={t} isOff={isOff} />
      <div>
        <Button
          variant="outline"
          isLoading={isTesting}
          startSlot={<Plug className="size-4" />}
          onClick={onTest}
        >
          {isTesting ? t.testingLabel : t.testConnection}
        </Button>
      </div>
    </Card>
  );
}

function ScopeCard({
  config,
  settings,
  t,
  onToggle,
}: {
  config: SourceConfig;
  settings: ScanSettings;
  t: SourceDetailMessages;
  onToggle: (name: string) => void;
}) {
  if (config.scope.length === 0) return null;
  return (
    <Card variant="outline" size="md" className="flex flex-col gap-3">
      <PanelTitle
        label={formatMessage(t.configScopeTitle, { scope: config.scopeLabel })}
        description={t.configScopeDescription}
      />
      <div className="flex flex-wrap gap-2">
        {config.scope.map((item) => {
          const isIncluded = item.isIncluded && !settings.excludedScope.includes(item.name);
          return (
            <Chip
              key={item.name}
              isSelected={isIncluded}
              tone="brand"
              onValueChange={() => {
                onToggle(item.name);
              }}
            >
              {item.name}
            </Chip>
          );
        })}
      </div>
    </Card>
  );
}

function StoreCard({ t }: { t: SourceDetailMessages }) {
  return (
    <Card variant="outline" size="md" className="flex flex-col gap-2">
      <PanelTitle label={t.configStoreTitle} />
      <div>
        <StoreRow label={t.storeLocations} value={t.storeYes} tone="success" />
        <StoreRow label={t.storeCounts} value={t.storeYes} tone="success" />
        <StoreRow label={t.storeMasked} value={t.storeYes} tone="success" />
        <StoreRow label={t.storeRaw} value={t.storeNever} tone="danger" />
        <StoreRow label={t.storeCredentials} value={t.storeEncrypted} tone="neutral" />
      </div>
    </Card>
  );
}

function DangerCard({ t, onDisconnect }: { t: SourceDetailMessages; onDisconnect: () => void }) {
  const [isArmed, setIsArmed] = useState(false);
  return (
    <Card variant="outline" size="md" isInvalid className="flex flex-col gap-3">
      <PanelTitle label={t.configDangerTitle} description={t.configDangerDescription} />
      <div>
        <Button
          tone="danger"
          variant={isArmed ? 'solid' : 'outline'}
          startSlot={<Unplug className="size-4" />}
          onClick={() => {
            if (isArmed) onDisconnect();
            else setIsArmed(true);
          }}
        >
          {isArmed ? t.configDisconnectConfirm : t.configDisconnectCta}
        </Button>
      </div>
    </Card>
  );
}

/** Sampling depth, schedule and detectors — the same three knobs as the wizard. */
function ScanSettingsCards({
  settings,
  t,
  onSettingsChange,
}: {
  settings: ScanSettings;
  t: SourceDetailMessages;
  onSettingsChange: (patch: Partial<ScanSettings>) => void;
}) {
  return (
    <>
      <Card variant="outline" size="md" className="flex flex-col gap-3">
        <PanelTitle label={t.configSamplingTitle} />
        <SegmentedControl
          label={t.samplingTitle}
          fullWidth
          items={[
            { value: 'quick', label: t.samplingQuick },
            { value: 'standard', label: t.samplingStandard },
            { value: 'deep', label: t.samplingDeep },
          ]}
          value={settings.sampling}
          onValueChange={(sampling) => {
            onSettingsChange({ sampling });
          }}
        />
        <SegmentedControl
          label={t.scheduleTitle}
          fullWidth
          items={[
            { value: 'daily', label: t.scheduleDaily },
            { value: 'weekly', label: t.scheduleWeekly },
            { value: 'manual', label: t.scheduleManual },
          ]}
          value={settings.schedule}
          onValueChange={(schedule) => {
            onSettingsChange({ schedule });
          }}
        />
      </Card>
      <Card variant="outline" size="md">
        <TagPicker
          label={t.detectorsTitle}
          options={ALL_DETECTORS.map((detector) => ({
            value: detector,
            label: t.detectorNames[detector] ?? detector,
            isSensitive: SENSITIVE_DETECTORS.includes(detector),
          }))}
          value={settings.detectors}
          onValueChange={(detectors) => {
            onSettingsChange({ detectors });
          }}
        />
      </Card>
    </>
  );
}

export function ConfigPanel({
  source,
  config,
  settings,
  t,
  isConnecting,
  isTesting,
  onSettingsChange,
  onTest,
  onSave,
  onConnect,
  onDisconnect,
}: {
  source: DataSource;
  config: SourceConfig;
  settings: ScanSettings;
  t: SourceDetailMessages;
  isConnecting: boolean;
  isTesting: boolean;
  onSettingsChange: (patch: Partial<ScanSettings>) => void;
  onTest: () => void;
  onSave: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const isOff = source.status === 'off';

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <ConnectionCard
          source={source}
          config={config}
          t={t}
          onTest={onTest}
          isTesting={isTesting}
        />
        <ScopeCard
          config={config}
          settings={settings}
          t={t}
          onToggle={(name) => {
            onSettingsChange({
              excludedScope: settings.excludedScope.includes(name)
                ? settings.excludedScope.filter((excluded) => excluded !== name)
                : [...settings.excludedScope, name],
            });
          }}
        />
        <ScanSettingsCards settings={settings} t={t} onSettingsChange={onSettingsChange} />
        <div className="flex flex-wrap items-center gap-3">
          {isOff ? (
            <Button
              tone="brand"
              isLoading={isConnecting}
              startSlot={<Rocket className="size-4" />}
              onClick={onConnect}
            >
              {isConnecting ? t.connectingLabel : t.connectCta}
            </Button>
          ) : (
            <Button tone="brand" startSlot={<Save className="size-4" />} onClick={onSave}>
              {t.configSaveCta}
            </Button>
          )}
          <Text size="xs" tone="muted">
            {isOff ? t.configConnectHint : t.configSaveHint}
          </Text>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <StoreCard t={t} />
        {isOff ? null : <DangerCard t={t} onDisconnect={onDisconnect} />}
      </div>
    </div>
  );
}
