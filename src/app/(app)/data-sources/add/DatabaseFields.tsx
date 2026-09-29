'use client';

/**
 * The database half of step 2 — identical on every engine, so it is written out
 * with translated labels rather than being carried per-connector.
 *
 * The "load databases" round trip is deliberate rather than a pre-filled list:
 * which databases exist is a fact about the server, so it cannot be known before
 * credentials are entered. Offering a list up front would be inventing one.
 */
import { RefreshCw } from 'lucide-react';
import { Card } from '@atoms/Card';
import { Button } from '@atoms/Button';
import { Checkbox } from '@atoms/Checkbox';
import { Input } from '@atoms/Input';
import { Text } from '@atoms/Text';
import { Field } from '@molecules/Field';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { PasswordInput } from '@molecules/PasswordInput';
import { SegmentedControl } from '@molecules/SegmentedControl';
import type { Connector } from '@shared/mock/connectors';
import {
  DB_FIELD,
  type AddSourceMessages,
  type AddSourceState,
  type DatabaseMode,
} from './AddSourceWizard.types';

function PanelHeader({ label, description }: { label: string; description?: string }) {
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

function DatabaseList({
  connector,
  state,
  t,
  onToggle,
}: {
  connector: Connector;
  state: AddSourceState;
  t: AddSourceMessages;
  onToggle: (name: string, isChecked: boolean) => void;
}) {
  if (!state.areDatabasesLoaded) {
    return (
      <Text size="sm" tone="muted">
        {t.dbNoneLoaded}
      </Text>
    );
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{t.dbSelectionLabel}</legend>
      {(connector.databases ?? []).map((database) => (
        <Checkbox
          key={database.name}
          checked={state.selectedDatabases.includes(database.name)}
          isDisabled={state.databaseMode === 'all'}
          onValueChange={(isChecked) => {
            onToggle(database.name, isChecked);
          }}
        >
          <span className="flex items-baseline gap-2">
            <Text as="span" size="sm" isMono>
              {database.name}
            </Text>
            <Text as="span" size="xs" tone="muted">
              {database.detail}
            </Text>
          </span>
        </Checkbox>
      ))}
    </fieldset>
  );
}

function ChoiceField({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly ListboxOption[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Listbox
      label={label}
      options={options}
      value={value}
      onValueChange={onValueChange}
      fullWidth
    />
  );
}

function HostAndPort({
  connector,
  state,
  t,
  invalidKeys,
  onValueChange,
}: {
  connector: Connector;
  state: AddSourceState;
  t: AddSourceMessages;
  invalidKeys: ReadonlySet<string>;
  onValueChange: (key: string, value: string) => void;
}) {
  const value = (key: string) => state.values[key] ?? '';
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label={t.dbHostLabel}
        isRequired
        errorMessage={invalidKeys.has(DB_FIELD.host) ? t.fieldRequired : undefined}
      >
        {(control) => (
          <Input
            {...control}
            placeholder={t.dbHostPlaceholder}
            value={value(DB_FIELD.host)}
            onChange={(event) => {
              onValueChange(DB_FIELD.host, event.target.value);
            }}
            fullWidth
          />
        )}
      </Field>
      <Field label={t.dbPortLabel}>
        {(control) => (
          <Input
            {...control}
            type="number"
            value={
              value(DB_FIELD.port) === '' ? String(connector.port ?? '') : value(DB_FIELD.port)
            }
            onChange={(event) => {
              onValueChange(DB_FIELD.port, event.target.value);
            }}
            fullWidth
          />
        )}
      </Field>
    </div>
  );
}

/** Host, port, credentials and SSL — the same five inputs on every engine. */
function CredentialFields({
  connector,
  state,
  t,
  invalidKeys,
  onValueChange,
}: {
  connector: Connector;
  state: AddSourceState;
  t: AddSourceMessages;
  invalidKeys: ReadonlySet<string>;
  onValueChange: (key: string, value: string) => void;
}) {
  const value = (key: string) => state.values[key] ?? '';
  const errorFor = (key: string) => (invalidKeys.has(key) ? t.fieldRequired : undefined);

  return (
    <>
      <ChoiceField
        label={t.dbInputModeLabel}
        options={[
          { value: 'separate', label: t.dbInputSeparate },
          { value: 'string', label: t.dbInputConnectionString },
        ]}
        value={value(DB_FIELD.inputMode) === '' ? 'separate' : value(DB_FIELD.inputMode)}
        onValueChange={(next) => {
          onValueChange(DB_FIELD.inputMode, next);
        }}
      />

      <HostAndPort
        connector={connector}
        state={state}
        t={t}
        invalidKeys={invalidKeys}
        onValueChange={onValueChange}
      />

      <Field label={t.dbUsernameLabel} isRequired errorMessage={errorFor(DB_FIELD.username)}>
        {(control) => (
          <Input
            {...control}
            placeholder={connector.userHint}
            value={value(DB_FIELD.username)}
            onChange={(event) => {
              onValueChange(DB_FIELD.username, event.target.value);
            }}
            fullWidth
          />
        )}
      </Field>

      <PasswordInput
        label={t.dbPasswordLabel}
        description={t.dbPasswordHint}
        value={value(DB_FIELD.password)}
        onValueChange={(next) => {
          onValueChange(DB_FIELD.password, next);
        }}
        autoComplete="new-password"
        fullWidth
      />

      <ChoiceField
        label={t.dbSslLabel}
        options={[
          { value: 'prefer', label: t.dbSslPrefer },
          { value: 'require', label: t.dbSslRequire },
          { value: 'disable', label: t.dbSslDisable },
        ]}
        value={value(DB_FIELD.ssl) === '' ? 'prefer' : value(DB_FIELD.ssl)}
        onValueChange={(next) => {
          onValueChange(DB_FIELD.ssl, next);
        }}
      />
    </>
  );
}

/** Which databases on the server this scan is allowed to look at. */
function DatabaseSelectionCard({
  connector,
  state,
  t,
  isLoadingDatabases,
  onChange,
  onLoadDatabases,
}: {
  connector: Connector;
  state: AddSourceState;
  t: AddSourceMessages;
  isLoadingDatabases: boolean;
  onChange: (patch: Partial<AddSourceState>) => void;
  onLoadDatabases: () => void;
}) {
  return (
    <Card variant="soft" size="md" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PanelHeader label={t.dbPanelTitle} description={t.dbPanelDescription} />
        <Button
          variant="outline"
          size="sm"
          isLoading={isLoadingDatabases}
          startSlot={<RefreshCw className="size-4" />}
          onClick={onLoadDatabases}
        >
          {isLoadingDatabases ? t.dbLoadingLabel : t.dbLoadCta}
        </Button>
      </div>
      <SegmentedControl
        label={t.dbPanelTitle}
        fullWidth
        items={[
          { value: 'all', label: t.dbModeAll },
          { value: 'selected', label: t.dbModeSelected },
        ]}
        value={state.databaseMode}
        onValueChange={(next) => {
          onChange({ databaseMode: next as DatabaseMode });
        }}
      />
      <Text size="xs" tone="muted">
        {state.databaseMode === 'all' ? t.dbModeAllDescription : t.dbModeSelectedDescription}
      </Text>
      <DatabaseList
        connector={connector}
        state={state}
        t={t}
        onToggle={(name, isChecked) => {
          onChange({
            selectedDatabases: isChecked
              ? [...state.selectedDatabases, name]
              : state.selectedDatabases.filter((selected) => selected !== name),
          });
        }}
      />
    </Card>
  );
}

export function DatabaseFields({
  connector,
  state,
  t,
  invalidKeys,
  isLoadingDatabases,
  onValueChange,
  onChange,
  onLoadDatabases,
}: {
  connector: Connector;
  state: AddSourceState;
  t: AddSourceMessages;
  invalidKeys: ReadonlySet<string>;
  isLoadingDatabases: boolean;
  onValueChange: (key: string, value: string) => void;
  onChange: (patch: Partial<AddSourceState>) => void;
  onLoadDatabases: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <CredentialFields
        connector={connector}
        state={state}
        t={t}
        invalidKeys={invalidKeys}
        onValueChange={onValueChange}
      />
      <DatabaseSelectionCard
        connector={connector}
        state={state}
        t={t}
        isLoadingDatabases={isLoadingDatabases}
        onChange={onChange}
        onLoadDatabases={onLoadDatabases}
      />
      <Checkbox
        checked={state.shouldSaveCredentials}
        onValueChange={(isChecked) => {
          onChange({ shouldSaveCredentials: isChecked });
        }}
      >
        <span className="flex flex-col">
          <Text as="span" size="sm" weight="medium">
            {t.saveCredentialsLabel}
          </Text>
          <Text as="span" size="xs" tone="muted">
            {t.saveCredentialsDescription}
          </Text>
        </span>
      </Checkbox>
    </div>
  );
}
