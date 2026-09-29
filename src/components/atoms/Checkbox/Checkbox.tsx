'use client';

/**
 * @tier atoms
 *
 * Checkbox. `indeterminate` has no HTML attribute — it exists only as a DOM
 * property — so it is set through a callback ref that re-runs when the prop
 * changes. That is also why this atom is a client component.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { cn } from '@shared/lib';
import type { CheckboxProps } from './Checkbox.types';

const sizes = {
  sm: { box: 'size-4', mark: 'size-2.5', text: 'text-xs' },
  md: { box: 'size-5', mark: 'size-3', text: 'text-sm' },
} as const;

/** Checked fill. Unchecked is always neutral — a red empty box reads as an error. */
const tones = {
  brand: 'checked:border-brand-solid checked:bg-brand-solid',
  accent: 'checked:border-accent-solid checked:bg-accent-solid',
  danger: 'checked:border-danger-solid checked:bg-danger-solid',
} as const;

const markTones = {
  brand: 'text-fg-on-brand',
  accent: 'text-fg-on-accent',
  danger: 'text-fg-on-danger',
} as const;

const box =
  'peer m-0 shrink-0 appearance-none rounded-xs border bg-bg-surface ' +
  'transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas disabled:cursor-not-allowed';

/**
 * `indeterminate` has no HTML attribute — it exists only as a DOM property, so it
 * is the one piece of checkbox state a declarative render cannot express, and the
 * only reason this atom is a client component.
 *
 * The node is held in a local ref and republished through `useImperativeHandle`
 * rather than by writing to the forwarded ref directly: mutating a ref handed in
 * from outside is exactly what `react-hooks/immutability` forbids, and it is the
 * kind of write that breaks in Strict Mode's double-invoked renders.
 */
function useIndeterminate(isIndeterminate: boolean) {
  const nodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) node.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  return nodeRef;
}

/**
 * Which mark to draw is decided in JS rather than with peer-checked /
 * peer-indeterminate variants: those have equal specificity, so a box that is
 * both would show whichever rule happened to land later in the stylesheet.
 */
function Mark({ isIndeterminate }: { isIndeterminate: boolean }) {
  if (isIndeterminate) return <span className="rounded-pill h-0.5 w-full bg-current" />;
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-full">
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/*
 * The exposed handle is `HTMLInputElement | null`, which is what it genuinely is
 * before mount — narrowing it to non-null here would only move the null check to
 * whoever consumes the ref.
 */
export const Checkbox = forwardRef<HTMLInputElement | null, CheckboxProps>(function Checkbox(
  {
    children,
    size = 'md',
    tone = 'brand',
    isIndeterminate = false,
    isInvalid = false,
    isRequired = false,
    isDisabled = false,
    onValueChange,
    onChange,
    className,
    testId,
    ...rest
  },
  ref,
) {
  const nodeRef = useIndeterminate(isIndeterminate);
  // Explicit type arguments: inference collapses `ForwardedRef<T | null>` and
  // `ForwardedRef<T>` to the same shape, so it would otherwise pick the non-null T
  // and reject the honest pre-mount value.
  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
    ref,
    () => nodeRef.current,
    [nodeRef],
  );
  const scale = sizes[size];

  return (
    <label
      className={cn(
        'inline-flex items-start gap-2',
        isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative grid shrink-0 place-items-center">
        <input
          {...rest}
          ref={nodeRef}
          type="checkbox"
          disabled={isDisabled}
          required={isRequired}
          aria-invalid={isInvalid || undefined}
          data-testid={testId}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.checked);
          }}
          className={cn(
            box,
            scale.box,
            tones[tone],
            isInvalid ? 'border-danger-solid' : 'border-border-strong',
          )}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute grid place-items-center opacity-0 peer-checked:opacity-100',
            isIndeterminate && 'opacity-100',
            markTones[tone],
            scale.mark,
          )}
        >
          <Mark isIndeterminate={isIndeterminate} />
        </span>
      </span>
      {children !== undefined && (
        <span className={cn('text-fg-default', scale.text)}>{children}</span>
      )}
    </label>
  );
});
