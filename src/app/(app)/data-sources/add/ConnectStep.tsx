'use client';

/** Step 2 — the credentials for the chosen connector. */
import { ShieldCheck } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import type { Connector } from '@shared/mock/connectors';
import { formatMessage } from '../format-message';
import type { AddSourceMessages, AddSourceState } from './AddSourceWizard.types';
import { ConnectorFieldInput } from './ConnectorFieldInput';
import { DatabaseFields } from './DatabaseFields';

function ConnectionHeader({
  connector,
  isDatabase,
  t,
}: Pick<ConnectStepProps, 'connector' | 't'> & { isDatabase: boolean }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="border-border-default bg-bg-surface rounded-control grid size-11 shrink-0 place-items-center border">
        <Avatar
          label={connector.name}
          initials={connector.mark}
          shape="rounded"
          size="md"
          tone="info"
        />
      </span>
      <div>
        <Heading level={2} size="xl" className="mb-0.5">
          {formatMessage(t.connectTitle, { name: connector.name })}
        </Heading>
        <Text size="sm" tone="muted">
          {isDatabase ? t.connectDbDescription : t.connectDescription}
        </Text>
      </div>
    </div>
  );
}

type ConnectStepProps = {
  connector: Connector;
  state: AddSourceState;
  t: AddSourceMessages;
  invalidKeys: ReadonlySet<string>;
  isLoadingDatabases: boolean;
  onValueChange: (key: string, value: string) => void;
  onChange: (patch: Partial<AddSourceState>) => void;
  onLoadDatabases: () => void;
};

export function ConnectStep({
  connector,
  state,
  t,
  invalidKeys,
  isLoadingDatabases,
  onValueChange,
  onChange,
  onLoadDatabases,
}: ConnectStepProps) {
  const isDatabase = connector.category === 'db';

  return (
    <div className="flex flex-col">
      <ConnectionHeader connector={connector} isDatabase={isDatabase} t={t} />

      {isDatabase ? (
        <DatabaseFields
          connector={connector}
          state={state}
          t={t}
          invalidKeys={invalidKeys}
          isLoadingDatabases={isLoadingDatabases}
          onValueChange={onValueChange}
          onChange={onChange}
          onLoadDatabases={onLoadDatabases}
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {connector.fields.map((field) => (
            <ConnectorFieldInput
              key={field.key}
              field={field}
              value={state.values[field.key] ?? ''}
              errorMessage={invalidKeys.has(field.key) ? t.fieldRequired : undefined}
              onValueChange={(next) => {
                onValueChange(field.key, next);
              }}
            />
          ))}
        </div>
      )}

      {connector.category === 'cloud' ? (
        <div className="border-border-default bg-bg-surface rounded-control flex items-start gap-3 border p-3.5">
          <ShieldCheck className="text-brand-fg mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <Text as="span" size="sm" weight="medium" className="block">
              {t.cloudReadOnlyLabel}
            </Text>
            <Text as="span" size="xs" tone="muted" className="block">
              {t.cloudReadOnlyDescription}
            </Text>
          </div>
        </div>
      ) : null}
    </div>
  );
}
