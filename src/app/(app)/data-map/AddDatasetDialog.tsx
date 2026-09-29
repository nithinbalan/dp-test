'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Input } from '@atoms/Input';
import { Text } from '@atoms/Text';
import { Field } from '@molecules/Field';
import { TagPicker } from '@molecules/TagPicker';
import { Dialog } from '@organisms/Dialog';
import {
  IDENTIFIER_LABELS,
  SENSITIVE_IDENTIFIERS,
  type IdentifierType,
} from '@shared/mock/data-map';
import type { DataMapMessages } from './DataMapMessages';

const IDENTIFIER_OPTIONS = (Object.keys(IDENTIFIER_LABELS) as IdentifierType[]).map((value) => ({
  value,
  label: IDENTIFIER_LABELS[value],
  isSensitive: SENSITIVE_IDENTIFIERS.includes(value),
}));

type FormState = {
  name: string;
  location: string;
  identifiers: string[];
  recordCount: string;
};

const EMPTY_FORM: FormState = { name: '', location: '', identifiers: [], recordCount: '' };

function NameLocationFields({
  t,
  form,
  onChange,
  submitted,
}: {
  t: DataMapMessages;
  form: FormState;
  onChange: (next: Partial<FormState>) => void;
  submitted: boolean;
}) {
  const nameError = submitted && !form.name.trim() ? t.dialogNameError : undefined;
  const locationError = submitted && !form.location.trim() ? t.dialogLocationError : undefined;

  return (
    <>
      <Field
        label={t.dialogNameLabel}
        description={t.dialogNameSub}
        isRequired
        errorMessage={nameError}
      >
        {(control) => (
          <Input
            {...control}
            placeholder={t.dialogNamePlaceholder}
            value={form.name}
            onChange={(event) => {
              onChange({ name: event.target.value });
            }}
            fullWidth
          />
        )}
      </Field>

      <Field
        label={t.dialogLocationLabel}
        description={t.dialogLocationSub}
        isRequired
        errorMessage={locationError}
      >
        {(control) => (
          <Input
            {...control}
            placeholder={t.dialogLocationPlaceholder}
            value={form.location}
            onChange={(event) => {
              onChange({ location: event.target.value });
            }}
            fullWidth
          />
        )}
      </Field>
    </>
  );
}

function IdentifierFieldGroup({
  t,
  identifiers,
  onChange,
  submitted,
}: {
  t: DataMapMessages;
  identifiers: string[];
  onChange: (identifiers: string[]) => void;
  submitted: boolean;
}) {
  const identifiersError =
    submitted && identifiers.length === 0 ? t.dialogIdentifiersError : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <TagPicker
        label={`${t.dialogIdentifiersLabel} *`}
        options={IDENTIFIER_OPTIONS}
        value={identifiers}
        onValueChange={onChange}
      />
      <Text size="xs" tone="muted">
        {t.dialogIdentifiersSub}
      </Text>
      {identifiersError !== undefined && (
        <Text size="xs" tone="danger">
          {identifiersError}
        </Text>
      )}
    </div>
  );
}

function DatasetForm({
  t,
  form,
  onChange,
  submitted,
}: {
  t: DataMapMessages;
  form: FormState;
  onChange: (next: Partial<FormState>) => void;
  submitted: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 pt-1">
      <div className="flex flex-col gap-1">
        <Badge variant="soft" tone="brand" size="sm" className="w-fit font-mono tracking-wider">
          {t.dialogStep}
        </Badge>
        <Text size="xs" tone="muted">
          {t.dialogDescription}
        </Text>
      </div>

      <NameLocationFields t={t} form={form} onChange={onChange} submitted={submitted} />

      <IdentifierFieldGroup
        t={t}
        identifiers={form.identifiers}
        onChange={(identifiers) => {
          onChange({ identifiers });
        }}
        submitted={submitted}
      />

      <Field label={t.dialogRecordCountLabel} description={t.dialogRecordCountSub}>
        {(control) => (
          <Input
            {...control}
            placeholder={t.dialogRecordCountPlaceholder}
            value={form.recordCount}
            onChange={(event) => {
              onChange({ recordCount: event.target.value });
            }}
            fullWidth
          />
        )}
      </Field>
    </div>
  );
}

export function AddDatasetDialog({
  t,
  isOpen,
  onClose,
  onSubmit,
}: {
  t: DataMapMessages;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, location: string, identifiers: string[], recordCount: number) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  function handleClose() {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    onClose();
  }

  function handleSubmit() {
    setSubmitted(true);
    if (!form.name.trim() || !form.location.trim() || form.identifiers.length === 0) {
      return;
    }
    const count = parseInt(form.recordCount.replace(/,/g, ''), 10) || 0;
    onSubmit(form.name.trim(), form.location.trim(), form.identifiers, count);
    setForm(EMPTY_FORM);
    setSubmitted(false);
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      label={t.dialogTitle}
      footerSlot={
        <div className="border-border-default flex w-full flex-wrap items-center justify-between gap-3 border-t pt-3">
          <Button variant="outline" onClick={handleClose}>
            {t.dialogCancel}
          </Button>
          <span className="text-fg-muted hidden flex-1 text-end font-mono text-xs tracking-wider uppercase sm:inline">
            {t.dialogManualNote}
          </span>
          <Button tone="brand" startSlot={<Plus className="size-4" />} onClick={handleSubmit}>
            {t.dialogSubmit}
          </Button>
        </div>
      }
    >
      <DatasetForm
        t={t}
        form={form}
        onChange={(next) => {
          setForm((current) => ({ ...current, ...next }));
        }}
        submitted={submitted}
      />
    </Dialog>
  );
}
