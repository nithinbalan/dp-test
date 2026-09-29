'use client';

/** Step 2 of the Add/Edit Activity wizard. Prototype source: `.rpa-step[data-rpstep="2"]`. */
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { TagPicker } from '@molecules/TagPicker';
import { Heading } from '@atoms/Heading';
import {
  IDENTIFIER_LABELS,
  SENSITIVE_IDENTIFIERS,
  type IdentifierType,
} from '@shared/mock/data-map';
import { DATA_SOURCES } from '@shared/mock/data-sources';
import type {
  AddActivityFieldErrors,
  AddActivityMessages,
  AddActivityState,
} from './AddActivityWizard.types';

const IDENTIFIER_OPTIONS = (Object.keys(IDENTIFIER_LABELS) as IdentifierType[]).map((value) => ({
  value,
  label: IDENTIFIER_LABELS[value],
  isSensitive: SENSITIVE_IDENTIFIERS.includes(value),
}));

/** Connected sources only — an off source cannot be where live data "lives". */
const STORAGE_OPTIONS = DATA_SOURCES.filter((source) => source.status === 'connected').map(
  (source) => ({ value: source.id, label: source.name }),
);

export function DataStep({
  t,
  state,
  errors,
  onChange,
}: {
  t: AddActivityMessages;
  state: AddActivityState;
  errors: AddActivityFieldErrors;
  onChange: (next: Partial<AddActivityState>) => void;
}) {
  const collectionOptions: ListboxOption[] = [
    { value: 'direct', label: t.wizardCollectionDirect },
    { value: 'partner', label: t.wizardCollectionPartner },
    { value: 'employee-records', label: t.wizardCollectionEmployee },
    { value: 'generated', label: t.wizardCollectionGenerated },
    { value: 'public', label: t.wizardCollectionPublic },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Heading level={2} size="lg">
        {t.step2Heading}
      </Heading>

      <TagPicker
        label={t.wizardIdentifiersLabel}
        description={t.wizardIdentifiersHint}
        options={IDENTIFIER_OPTIONS}
        value={state.identifiers}
        errorMessage={errors.identifiers ? t.wizardIdentifiersError : undefined}
        onValueChange={(identifiers) => {
          onChange({ identifiers });
        }}
      />

      <Listbox
        label={t.wizardCollectionSourceLabel}
        description={t.wizardCollectionSourceHint}
        options={collectionOptions}
        value={state.collectionSource}
        onValueChange={(collectionSource) => {
          onChange({ collectionSource });
        }}
        fullWidth
      />

      <TagPicker
        label={t.wizardStorageLabel}
        description={t.wizardStorageHint}
        options={STORAGE_OPTIONS}
        value={state.storageLocations}
        onValueChange={(storageLocations) => {
          onChange({ storageLocations });
        }}
      />
    </div>
  );
}
