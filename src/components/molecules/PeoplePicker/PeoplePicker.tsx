'use client';

/**
 * @tier molecules
 *
 * Composes Label, Input, Avatar and Button atoms. Owns the edit/list-open
 * state locally — the selected id itself is controlled by the caller.
 *
 * Two variants live here: `inline`'s pill-and-search (`PeoplePickerInline`,
 * the original shape, still used by RoPA/DPIA/risk owner fields) and
 * `trigger`'s combobox button plus anchored popover (`PeoplePickerTrigger` +
 * `PeoplePickerPopover`, in this folder) for fields that read as a
 * persistent setting.
 */
import { useId } from 'react';
import { Label } from '@atoms/Label';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import { InlinePeoplePicker } from './PeoplePickerInline';
import { TriggerPeoplePicker } from './PeoplePickerTriggerPicker';
import type { PeoplePickerMessages, PeoplePickerProps } from './PeoplePicker.types';

const DEFAULT_MESSAGES: PeoplePickerMessages = {
  placeholder: 'Search people…',
  changeLabel: 'Change',
  noResults: 'No matches',
  searchPlaceholder: 'Search name, role or team…',
  escHint: 'ESC',
  footerLabel: '{count} of {total} from the Employee register',
  manageLabel: 'Manage',
};

/** The `label`/`description` pair, hidden when an external layout already shows them. */
function PeoplePickerCaption({
  id,
  label,
  labelHint,
  description,
  isRequired,
  isDisabled,
}: {
  id: string;
  label: string;
  labelHint: string | undefined;
  description: string | undefined;
  isRequired: boolean;
  isDisabled: boolean;
}) {
  return (
    <>
      <Label htmlFor={id} size="sm" isRequired={isRequired} isDisabled={isDisabled}>
        {label}
        {labelHint !== undefined && (
          <Text as="span" size="xs" weight="regular" tone="muted">
            {' '}
            — {labelHint}
          </Text>
        )}
      </Label>
      {description !== undefined && (
        <Text size="xs" tone="muted">
          {description}
        </Text>
      )}
    </>
  );
}

export function PeoplePicker({
  label,
  isLabelVisible = true,
  labelHint,
  description,
  people,
  value,
  onValueChange,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  variant = 'inline',
  employeeRegisterHref,
  totalCount,
  messages,
  className,
  testId,
}: PeoplePickerProps) {
  const id = useId();
  const listId = `${id}-list`;
  const t = { ...DEFAULT_MESSAGES, ...messages };
  const isInvalid = errorMessage !== undefined && errorMessage !== '';
  const accessibleLabel = labelHint !== undefined ? `${label} — ${labelHint}` : label;

  return (
    <div className={cn('flex flex-col gap-1.5', className)} data-testid={testId}>
      {isLabelVisible && (
        <PeoplePickerCaption
          id={id}
          label={label}
          labelHint={labelHint}
          description={description}
          isRequired={isRequired}
          isDisabled={isDisabled}
        />
      )}

      {variant === 'trigger' ? (
        <TriggerPeoplePicker
          id={id}
          listId={listId}
          label={accessibleLabel}
          people={people}
          value={value}
          onValueChange={onValueChange}
          t={t}
          isInvalid={isInvalid}
          isDisabled={isDisabled}
          employeeRegisterHref={employeeRegisterHref}
          totalCount={totalCount ?? people.length}
        />
      ) : (
        <InlinePeoplePicker
          id={id}
          listId={listId}
          people={people}
          value={value}
          onValueChange={onValueChange}
          t={t}
          isInvalid={isInvalid}
          isRequired={isRequired}
          isDisabled={isDisabled}
        />
      )}

      {isInvalid && (
        <p role="alert" className="text-danger-fg text-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
