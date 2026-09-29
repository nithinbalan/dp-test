'use client';

/**
 * @tier molecules
 *
 * Composes Label, Text and the trigger/popover pair in this folder into a
 * single-select control with a fully themeable option list — see
 * `Listbox.types.ts` for when this earns its keep over the native `Select`.
 */
import { useId } from 'react';
import { Label } from '@atoms/Label';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import { ListboxTrigger } from './ListboxTrigger';
import { ListboxPopover } from './ListboxPopover';
import { useListboxPopover } from './useListboxPopover';
import type { ListboxOption, ListboxProps } from './Listbox.types';

export type { ListboxOption, ListboxProps };

function ListboxLabel({
  id,
  label,
  labelHint,
  isVisible,
  isRequired,
  isDisabled,
}: {
  id: string;
  label: string;
  labelHint: string | undefined;
  isVisible: boolean;
  isRequired: boolean;
  isDisabled: boolean;
}) {
  if (!isVisible) return null;
  return (
    <Label htmlFor={id} size="sm" isRequired={isRequired} isDisabled={isDisabled}>
      {label}
      {labelHint !== undefined && (
        <Text as="span" size="xs" weight="regular" tone="muted">
          {' '}
          — {labelHint}
        </Text>
      )}
    </Label>
  );
}

function accessibleLabelFor(label: string, labelHint: string | undefined): string {
  return labelHint !== undefined ? `${label} — ${labelHint}` : label;
}

function isListboxInvalid(isInvalid: boolean, errorMessage: string | undefined): boolean {
  return isInvalid || (errorMessage !== undefined && errorMessage !== '');
}

function ListboxHelp({
  description,
  errorMessage,
  isInvalid,
}: {
  description: string | undefined;
  errorMessage: string | undefined;
  isInvalid: boolean;
}) {
  return (
    <>
      {description !== undefined && (
        <Text size="xs" tone="muted">
          {description}
        </Text>
      )}
      {isInvalid && errorMessage !== undefined && (
        <p role="alert" className="text-danger-fg text-xs">
          {errorMessage}
        </p>
      )}
    </>
  );
}

export function Listbox({
  label,
  isLabelVisible = true,
  labelHint,
  options,
  value,
  onValueChange,
  placeholder,
  emptyOptionsLabel,
  description,
  errorMessage,
  size = 'md',
  isInvalid = false,
  isRequired = false,
  isDisabled = false,
  fullWidth = false,
  startSlot,
  className,
  testId,
}: ListboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const { isOpen, triggerRef, popoverRef, position, toggle, close, onKeyDown } =
    useListboxPopover();
  const invalid = isListboxInvalid(isInvalid, errorMessage);
  const selected = options.find((option) => option.value === value);
  const accessibleLabel = accessibleLabelFor(label, labelHint);

  function onSelect(option: ListboxOption) {
    onValueChange(option.value);
    close();
  }

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      <ListboxLabel
        id={id}
        label={label}
        labelHint={labelHint}
        isVisible={isLabelVisible}
        isRequired={isRequired}
        isDisabled={isDisabled}
      />

      <div ref={triggerRef} onKeyDown={onKeyDown}>
        <ListboxTrigger
          id={id}
          listId={listId}
          label={accessibleLabel}
          optionLabel={selected?.label}
          placeholder={placeholder}
          size={size}
          startSlot={startSlot}
          isOpen={isOpen}
          isInvalid={invalid}
          isRequired={isRequired}
          isDisabled={isDisabled}
          className={className}
          testId={testId}
          onClick={toggle}
        />

        {isOpen && position && (
          <ListboxPopover
            ref={popoverRef}
            listId={listId}
            position={position}
            options={options}
            value={value}
            emptyOptionsLabel={emptyOptionsLabel}
            onSelect={onSelect}
            onKeyDown={onKeyDown}
          />
        )}
      </div>

      <ListboxHelp description={description} errorMessage={errorMessage} isInvalid={invalid} />
    </div>
  );
}
