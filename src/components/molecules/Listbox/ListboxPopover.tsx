'use client';

/**
 * @tier molecules
 *
 * The open state: an anchored popup listing every option, themeable end to
 * end (unlike the native `<select>` popup `Select` intentionally leaves to
 * the platform). Portaled to `document.body` and positioned `fixed` from
 * `useAnchoredPopover`'s live measurement, so it's never clipped by a
 * scroll-bounded ancestor (a wizard body with its own `overflow-y-auto`,
 * a table's scroll region, …) the way an `absolute`-positioned popup
 * anchored to a `relative` parent would be.
 */
import { forwardRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { AnchoredPopoverPosition } from '@shared/lib';
import { ListboxOption } from './ListboxOption';
import type { ListboxOption as ListboxOptionType } from './Listbox.types';

export const ListboxPopover = forwardRef<
  HTMLDivElement,
  {
    listId: string;
    position: AnchoredPopoverPosition;
    options: readonly ListboxOptionType[];
    value: string | undefined;
    emptyOptionsLabel: string | undefined;
    onSelect: (option: ListboxOptionType) => void;
    onKeyDown: (event: KeyboardEvent) => void;
  }
>(function ListboxPopover(
  { listId, position, options, value, emptyOptionsLabel, onSelect, onKeyDown },
  ref,
) {
  return createPortal(
    <div
      ref={ref}
      role="listbox"
      id={listId}
      style={position.style}
      className={cn(
        'border-border-default bg-bg-surface rounded-surface z-50 overflow-y-auto border p-1 shadow-lg',
        'max-h-72',
      )}
      onKeyDown={onKeyDown}
    >
      {options.length === 0
        ? emptyOptionsLabel !== undefined && (
            <Text size="sm" tone="muted" className="p-3 text-center">
              {emptyOptionsLabel}
            </Text>
          )
        : options.map((option) => (
            <ListboxOption
              key={option.value}
              option={option}
              isSelected={option.value === value}
              onSelect={onSelect}
            />
          ))}
    </div>,
    document.body,
  );
});
