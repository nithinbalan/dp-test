'use client';

/**
 * @tier molecules
 *
 * Composes Label, Input, Badge and Button atoms. Owns the edit/pill toggle as
 * local state; the subdomain value itself is controlled by the caller.
 */
import { useId, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Input } from '@atoms/Input';
import { Label } from '@atoms/Label';
import { cn } from '@shared/lib';
import type { WorkspaceFieldMessages, WorkspaceFieldProps } from './WorkspaceField.types';

const DEFAULT_MESSAGES: WorkspaceFieldMessages = {
  label: 'Workspace',
  placeholder: 'yourcompany',
  changeLabel: 'Change',
};

/** Lowercases and strips anything but letters, digits and hyphens, as the user types. */
function sanitize(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export function WorkspaceField({
  value,
  onValueChange,
  domain,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  messages,
  className,
  testId,
}: WorkspaceFieldProps) {
  const [isEditing, setIsEditing] = useState(value === '');
  const id = useId();
  const errorId = `${id}-error`;
  const t = { ...DEFAULT_MESSAGES, ...messages };
  const isInvalid = errorMessage !== undefined && errorMessage !== '';

  if (!isEditing && value !== '') {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        <Label size="sm">{t.label}</Label>
        <div className="border-border-default bg-bg-subtle rounded-control flex h-9 items-center justify-between gap-2 border px-3">
          <Badge variant="soft" tone="neutral" startSlot={<Building2 className="size-3.5" />}>
            {value}
            {domain}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            isDisabled={isDisabled}
            onClick={() => {
              setIsEditing(true);
            }}
            testId={testId !== undefined ? `${testId}-change` : undefined}
          >
            {t.changeLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} size="sm" isRequired={isRequired} isDisabled={isDisabled}>
        {t.label}
      </Label>
      <Input
        id={id}
        type="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t.placeholder}
        value={value}
        onChange={(event) => {
          onValueChange(sanitize(event.target.value));
        }}
        onBlur={() => {
          if (value !== '') setIsEditing(false);
        }}
        aria-describedby={isInvalid ? errorId : undefined}
        aria-invalid={isInvalid || undefined}
        isInvalid={isInvalid}
        isRequired={isRequired}
        isDisabled={isDisabled}
        fullWidth
        testId={testId}
        endSlot={<span className="text-xs">{domain}</span>}
      />
      {isInvalid && (
        <p id={errorId} role="alert" className="text-danger-fg text-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
