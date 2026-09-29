'use client';

/**
 * @tier molecules
 *
 * Tab strip. Implements the WAI-ARIA tabs keyboard contract by hand — there is no
 * native element for it — including the part that is easy to miss: Arrow keys are
 * PHYSICAL, so in Arabic the left arrow must move to the NEXT tab, not the
 * previous one. That is the one place a logical CSS property cannot help.
 */
import { useId, type KeyboardEvent } from 'react';
import { useDirection } from '@shared/hooks';
import { cn } from '@shared/lib';
import type { TabsProps } from './Tabs.types';

const sizes = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
} as const;

const lists = {
  ghost: 'border-border-default flex gap-1 border-b',
  soft: 'bg-bg-subtle rounded-control inline-flex gap-0.5 p-0.5',
} as const;

const tabs = {
  ghost:
    'text-fg-muted -mb-px border-b-2 border-transparent hover:text-fg-default ' +
    'aria-selected:border-brand-solid aria-selected:text-fg-default',
  soft:
    'text-fg-muted rounded-control hover:text-fg-default ' +
    'aria-selected:bg-bg-surface aria-selected:text-fg-default aria-selected:shadow-sm',
} as const;

const base =
  'inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold ' +
  'whitespace-nowrap transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

/** Element ids for a tab and its panel, so both sides can point at each other. */
export const tabIds = (prefix: string, value: string) => ({
  tab: `${prefix}-tab-${value}`,
  panel: `${prefix}-panel-${value}`,
});

/** Spread onto the panel element the caller renders. */
export const tabPanelProps = (prefix: string, value: string) => {
  const ids = tabIds(prefix, value);
  return { id: ids.panel, role: 'tabpanel', 'aria-labelledby': ids.tab, tabIndex: 0 } as const;
};

export function Tabs({
  label,
  items,
  value,
  onValueChange,
  size = 'md',
  variant = 'ghost',
  fullWidth = false,
  idPrefix,
  className,
  testId,
}: TabsProps) {
  const generatedPrefix = useId();
  const prefix = idPrefix ?? generatedPrefix;
  const direction = useDirection();

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const selectable = items.filter((item) => item.isDisabled !== true);
    const current = selectable.findIndex((item) => item.value === value);
    if (current === -1) return;

    // The arrows are physical; the tab order is logical. In RTL they disagree,
    // and this is the mapping that reconciles them.
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

    let next = current;
    if (event.key === forward) next = (current + 1) % selectable.length;
    else if (event.key === backward) next = (current - 1 + selectable.length) % selectable.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = selectable.length - 1;
    else return;

    event.preventDefault();
    const target = selectable[next];
    if (!target) return;
    onValueChange(target.value);
    // `getElementById`, not `querySelector`: React's generated ids contain colons,
    // which are legal in an id and illegal in a CSS selector. Escaping them would
    // work and would also be a footgun the next person has to rediscover.
    document.getElementById(tabIds(prefix, target.value).tab)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      data-testid={testId}
      onKeyDown={handleKeyDown}
      className={cn(lists[variant], fullWidth && 'w-full', className)}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        const ids = tabIds(prefix, item.value);
        return (
          <button
            key={item.value}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={ids.panel}
            // One tab stop for the whole strip: arrows move between tabs, Tab
            // leaves it. A strip of nine tabs is otherwise nine stops on the way
            // to the content.
            tabIndex={isActive ? 0 : -1}
            disabled={item.isDisabled}
            onClick={() => {
              onValueChange(item.value);
            }}
            className={cn(base, sizes[size], tabs[variant], fullWidth && 'flex-1')}
          >
            {item.startSlot !== undefined && (
              <span aria-hidden className="grid shrink-0 place-items-center">
                {item.startSlot}
              </span>
            )}
            {item.label}
            {item.endSlot !== undefined && <span className="shrink-0">{item.endSlot}</span>}
          </button>
        );
      })}
    </div>
  );
}
