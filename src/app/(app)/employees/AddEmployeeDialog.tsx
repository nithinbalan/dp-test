'use client';

/** "Add employee" form — a focused Dialog over `POST /api/employees` via `useCreateEmployee()`. */
import { useState } from 'react';
import { Button } from '@atoms/Button';
import { Input } from '@atoms/Input';
import { Field } from '@molecules/Field';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { Dialog } from '@organisms/Dialog';
import { ApiError } from '@shared/lib/api-client';
import { useCreateEmployee, useDepartments, useToast } from '@shared/hooks';
import type { EmployeesMessages } from './EmployeesMessages';

const EMPTY_DRAFT = {
  fullName: '',
  workEmail: '',
  department: '',
  designation: '',
};

type Draft = typeof EMPTY_DRAFT;

function NameAndCodeFields({
  t,
  draft,
  errorMessage,
  onChange,
}: {
  t: EmployeesMessages;
  draft: Draft;
  errorMessage: string | undefined;
  onChange: (patch: Partial<Draft>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={t.fieldFullName} isRequired errorMessage={errorMessage}>
        {(control) => (
          <Input
            {...control}
            value={draft.fullName}
            onChange={(event) => {
              onChange({ fullName: event.target.value });
            }}
            placeholder={t.fieldFullNamePlaceholder}
            fullWidth
          />
        )}
      </Field>

      <Field label={t.fieldEmployeeCode} description={t.fieldEmployeeCodeHint}>
        {(control) => (
          <Input
            {...control}
            value=""
            placeholder={t.fieldEmployeeCodePlaceholder}
            isDisabled
            fullWidth
          />
        )}
      </Field>
    </div>
  );
}

function DesignationAndEmailFields({
  t,
  draft,
  onChange,
}: {
  t: EmployeesMessages;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={t.fieldDesignation}>
        {(control) => (
          <Input
            {...control}
            value={draft.designation}
            onChange={(event) => {
              onChange({ designation: event.target.value });
            }}
            placeholder={t.fieldDesignationPlaceholder}
            fullWidth
          />
        )}
      </Field>

      <Field label={t.fieldWorkEmail}>
        {(control) => (
          <Input
            {...control}
            type="email"
            value={draft.workEmail}
            onChange={(event) => {
              onChange({ workEmail: event.target.value });
            }}
            placeholder={t.fieldWorkEmailPlaceholder}
            fullWidth
          />
        )}
      </Field>
    </div>
  );
}

/**
 * Sourced from `/api/departments` — the same list Configuration Studio's
 * "Department" panel manages, so a department only ever needs to be typed
 * once. A workspace with no departments yet shows a disabled field with a
 * hint instead of a dropdown with nothing in it.
 */
function DepartmentField({
  t,
  draft,
  onChange,
}: {
  t: EmployeesMessages;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const { data, isLoading } = useDepartments();
  // A department an admin has deactivated in Configuration Studio shouldn't
  // be offered for a NEW employee — it stays visible there only so existing
  // assignments and history aren't silently dropped.
  const options: ListboxOption[] = (data ?? [])
    .filter((row) => row.isActive)
    .map((row) => ({
      value: row.name,
      label: row.name,
    }));
  const hasOptions = options.length > 0;

  return (
    <Listbox
      label={t.fieldDepartment}
      description={!isLoading && !hasOptions ? t.fieldDepartmentEmptyHint : undefined}
      options={options}
      placeholder={t.fieldDepartmentPlaceholder}
      value={draft.department === '' ? undefined : draft.department}
      onValueChange={(department) => {
        onChange({ department });
      }}
      isDisabled={isLoading || !hasOptions}
      fullWidth
    />
  );
}

function useAddEmployeeForm(t: EmployeesMessages, onDone: () => void) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const createEmployee = useCreateEmployee();
  const toast = useToast();

  function reset() {
    setDraft(EMPTY_DRAFT);
    setErrorMessage(undefined);
  }

  function onChange(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function submit() {
    const fullName = draft.fullName.trim();
    if (fullName.length === 0) {
      setErrorMessage(t.errorNameRequired);
      return;
    }
    setErrorMessage(undefined);

    createEmployee.mutate(
      { ...draft, fullName },
      {
        onSuccess: () => {
          toast.show({
            label: t.toastEmployeeCreated.replace('{name}', fullName),
            tone: 'success',
          });
          reset();
          onDone();
        },
        onError: (error) => {
          const isConflict = error instanceof ApiError && error.code === 'CONFLICT';
          setErrorMessage(isConflict ? t.errorEmailConflict : t.errorGeneric);
        },
      },
    );
  }

  return { draft, errorMessage, onChange, submit, reset, isPending: createEmployee.isPending };
}

export function AddEmployeeDialog({
  t,
  isOpen,
  onClose,
}: {
  t: EmployeesMessages;
  isOpen: boolean;
  onClose: () => void;
}) {
  const form = useAddEmployeeForm(t, onClose);

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      label={t.addEmployeeDialogTitle}
      description={t.addEmployeeDialogDescription}
      placement="end"
      size="lg"
      testId="add-employee-dialog"
      footerSlot={
        <>
          <Button variant="outline" onClick={handleClose} isDisabled={form.isPending}>
            {t.cancelCta}
          </Button>
          <Button tone="brand" onClick={form.submit} isDisabled={form.isPending}>
            {t.createEmployeeCta}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <NameAndCodeFields
          t={t}
          draft={form.draft}
          errorMessage={form.errorMessage}
          onChange={form.onChange}
        />
        <DesignationAndEmailFields t={t} draft={form.draft} onChange={form.onChange} />
        <DepartmentField t={t} draft={form.draft} onChange={form.onChange} />
      </div>
    </Dialog>
  );
}
