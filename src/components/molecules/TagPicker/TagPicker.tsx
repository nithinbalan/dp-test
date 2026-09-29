/**
 * @tier molecules
 *
 * Composes Label and Chip atoms. Owns no selection state — the caller does,
 * same as every other controlled form molecule here.
 */
import { Chip } from '@atoms/Chip';
import { Label } from '@atoms/Label';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { TagPickerProps } from './TagPicker.types';

export function TagPicker({
  label,
  isLabelVisible = true,
  description,
  options,
  value,
  onValueChange,
  errorMessage,
  isDisabled = false,
  className,
  testId,
}: TagPickerProps) {
  const isInvalid = errorMessage !== undefined && errorMessage !== '';

  function toggle(optionValue: string, isSelected: boolean) {
    onValueChange(isSelected ? [...value, optionValue] : value.filter((v) => v !== optionValue));
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {isLabelVisible && (
        <>
          <Label size="sm">{label}</Label>
          {description !== undefined && (
            <Text size="xs" tone="muted">
              {description}
            </Text>
          )}
        </>
      )}
      <div role="group" aria-label={label} data-testid={testId} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.value}
            tone={option.isSensitive ? 'danger' : 'neutral'}
            isSelected={value.includes(option.value)}
            isDisabled={isDisabled || option.isLocked}
            endSlot={
              option.caption !== undefined ? (
                <span className="text-2xs opacity-70">{option.caption}</span>
              ) : undefined
            }
            onValueChange={(isSelected) => {
              if (option.isLocked === true) return;
              toggle(option.value, isSelected);
            }}
          >
            {option.label}
          </Chip>
        ))}
      </div>
      {isInvalid && (
        <p role="alert" className="text-danger-fg text-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
