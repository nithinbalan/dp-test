'use client';

/**
 * Configuration Studio "Department" panel — adds to the shared list of
 * department names the Employees "Add employee" form picks from. Wired to
 * `/api/departments` via `useCreateDepartment()` (TanStack Query,
 * docs/TANSTACK_QUERY.md, ADR-0006). Real, DB-backed state — a department is
 * added immediately, there is no local draft to save.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Input } from '@atoms/Input';
import { Text } from '@atoms/Text';
import { ApiError } from '@shared/lib/api-client';
import { useCreateDepartment, useToast } from '@shared/hooks';
import type { SettingsMessages } from './SettingsMessages';
import { SettingsRow } from './SettingsRow';

/** The field + validation message. The Save action lives outside the Card — see `DepartmentPanel`. */
function DepartmentNameField({
  name,
  errorMessage,
  onChange,
  t,
}: {
  name: string;
  errorMessage: string | undefined;
  onChange: (value: string) => void;
  t: SettingsMessages;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SettingsRow
        label={t.departmentNameLabel}
        description={t.departmentNameDescription}
        control={
          <Input
            value={name}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            placeholder={t.departmentNamePlaceholder}
            aria-label={t.departmentNameLabel}
            isInvalid={errorMessage !== undefined}
            className="w-64"
          />
        }
      />
      {errorMessage !== undefined && (
        <Text size="xs" tone="danger" className="text-end">
          {errorMessage}
        </Text>
      )}
    </div>
  );
}

export function DepartmentPanel({ t }: { t: SettingsMessages }) {
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const createDepartment = useCreateDepartment();
  const toast = useToast();

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setErrorMessage(t.departmentNameRequired);
      return;
    }
    setErrorMessage(undefined);

    createDepartment.mutate(trimmed, {
      onSuccess: () => {
        toast.show({
          label: t.toastDepartmentCreated.replace('{name}', trimmed),
          tone: 'success',
        });
        setName('');
      },
      onError: (error) => {
        const isConflict = error instanceof ApiError && error.code === 'CONFLICT';
        setErrorMessage(isConflict ? t.departmentNameConflict : t.errorGeneric);
      },
    });
  }

  return (
    <>
      <Card variant="outline" className="flex flex-col gap-4">
        <DepartmentNameField name={name} errorMessage={errorMessage} onChange={setName} t={t} />
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Text size="xs" tone="muted" isMono className="tracking-wide uppercase">
          {t.footerHint}
        </Text>
        <Button
          tone="brand"
          size="sm"
          startSlot={<Check className="size-4" />}
          onClick={handleSubmit}
          isDisabled={createDepartment.isPending}
        >
          {t.saveCta}
        </Button>
      </div>
    </>
  );
}
