'use client';

/**
 * @tier molecules
 *
 * Composes Label, Input and IconButton atoms into a password field with a
 * show/hide toggle. Owns only the toggle's visibility state — the value itself
 * is controlled by the caller.
 */
import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { IconButton } from '@atoms/IconButton';
import { Input } from '@atoms/Input';
import { Label } from '@atoms/Label';
import { cn } from '@shared/lib';
import type { PasswordInputMessages, PasswordInputProps } from './PasswordInput.types';

const DEFAULT_MESSAGES: PasswordInputMessages = {
  showLabel: 'Show password',
  hideLabel: 'Hide password',
};

/** Space-separated ids for `aria-describedby`, or undefined when there is nothing to point at. */
function describedByIds(ids: (string | false)[]): string | undefined {
  const present = ids.filter((id): id is string => id !== false);
  return present.length > 0 ? present.join(' ') : undefined;
}

function VisibilityToggle({
  isVisible,
  isDisabled,
  showLabel,
  hideLabel,
  onToggle,
}: {
  isVisible: boolean;
  isDisabled: boolean;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
}) {
  return (
    <IconButton
      label={isVisible ? hideLabel : showLabel}
      size="xs"
      variant="ghost"
      isDisabled={isDisabled}
      onClick={onToggle}
    >
      {isVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </IconButton>
  );
}

export function PasswordInput({
  label,
  value,
  onValueChange,
  description,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  autoComplete,
  messages,
  size = 'md',
  fullWidth = false,
  className,
  testId,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const t = { ...DEFAULT_MESSAGES, ...messages };
  const isInvalid = errorMessage !== undefined && errorMessage !== '';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} size="sm" isRequired={isRequired} isDisabled={isDisabled}>
        {label}
      </Label>

      <Input
        id={id}
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        aria-describedby={describedByIds([
          description !== undefined && descriptionId,
          isInvalid && errorId,
        ])}
        aria-invalid={isInvalid || undefined}
        isInvalid={isInvalid}
        isRequired={isRequired}
        isDisabled={isDisabled}
        size={size}
        fullWidth={fullWidth}
        testId={testId}
        endSlot={
          <VisibilityToggle
            isVisible={isVisible}
            isDisabled={isDisabled}
            showLabel={t.showLabel}
            hideLabel={t.hideLabel}
            onToggle={() => {
              setIsVisible((current) => !current);
            }}
          />
        }
      />

      {description !== undefined && (
        <p id={descriptionId} className="text-fg-subtle text-xs">
          {description}
        </p>
      )}

      {isInvalid && (
        <p id={errorId} role="alert" className="text-danger-fg text-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
