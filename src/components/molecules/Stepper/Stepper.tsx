/**
 * @tier molecules
 *
 * Wizard progress. Renders an ordered list, so a screen reader announces "3 of 5"
 * without the component computing it, and `aria-current="step"` marks where the
 * user is standing.
 */
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { StepperMessages, StepperProps, StepperStep } from './Stepper.types';

const DEFAULT_MESSAGES: StepperMessages = {
  label: 'Progress',
  completed: 'completed',
  current: 'current step',
};

const sizes = {
  sm: { marker: 'size-6 text-2xs' },
  md: { marker: 'size-7 text-xs' },
} as const;

const markerStates = {
  complete: 'bg-brand-subtle border-brand-solid text-brand-fg',
  current: 'bg-brand-solid border-brand-solid text-fg-on-brand',
  upcoming: 'bg-bg-surface border-border-default text-fg-subtle',
} as const;

const Check = (
  <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
    <path
      d="M3.5 8.5l3 3 6-7"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Stepper({
  steps,
  activeIndex,
  onValueChange,
  orientation = 'horizontal',
  size = 'md',
  messages,
  className,
  testId,
}: StepperProps) {
  const t = { ...DEFAULT_MESSAGES, ...messages };
  const scale = sizes[size];
  const isVertical = orientation === 'vertical';

  return (
    <ol
      aria-label={t.label}
      data-testid={testId}
      className={cn('flex', isVertical ? 'flex-col gap-4' : 'w-full items-center gap-2', className)}
    >
      {steps.map((step, index) => (
        <Step
          key={step.value}
          step={step}
          index={index}
          activeIndex={activeIndex}
          isLast={index === steps.length - 1}
          isVertical={isVertical}
          size={size}
          scale={scale}
          messages={t}
          onValueChange={onValueChange}
        />
      ))}
    </ol>
  );
}

/** One index describes the whole flow: everything before it is done, the rest is not. */
type StepState = 'complete' | 'current' | 'upcoming';

const stepState = (index: number, activeIndex: number): StepState =>
  index < activeIndex ? 'complete' : index === activeIndex ? 'current' : 'upcoming';

const connectorTones: Record<StepState, string> = {
  complete: 'bg-brand-solid',
  current: 'bg-border-default',
  upcoming: 'bg-border-default',
};

const labelTones: Record<StepState, 'neutral' | 'brand' | 'subtle'> = {
  complete: 'brand',
  current: 'neutral',
  upcoming: 'subtle',
};

/** Label, optional description, and the same state restated for screen readers. */
function StepLabel({
  step,
  state,
  size,
  isVertical,
  messages,
}: {
  step: StepperStep;
  state: StepState;
  size: 'sm' | 'md';
  isVertical: boolean;
  messages: StepperMessages;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <Text
        as="span"
        size={size === 'sm' ? 'xs' : 'sm'}
        weight="semibold"
        tone={labelTones[state]}
        isTruncated={!isVertical}
      >
        {step.label}
      </Text>
      {isVertical && step.description !== undefined && (
        <Text as="span" size="xs" tone="muted">
          {step.description}
        </Text>
      )}
      {/* The visible state is colour and a tick; this is the same state in words. */}
      {state === 'complete' && <span className="sr-only">{messages.completed}</span>}
      {state === 'current' && <span className="sr-only">{messages.current}</span>}
    </div>
  );
}

/**
 * One row of the list. Extracted so the map body stays a render — its branching
 * is genuinely about a single step's three states, not about the list.
 */
function Step({
  step,
  index,
  activeIndex,
  isLast,
  isVertical,
  size,
  scale,
  messages,
  onValueChange,
}: {
  step: StepperStep;
  index: number;
  activeIndex: number;
  isLast: boolean;
  isVertical: boolean;
  size: 'sm' | 'md';
  scale: (typeof sizes)[keyof typeof sizes];
  messages: StepperMessages;
  onValueChange?: ((value: string) => void) | undefined;
}) {
  const state = stepState(index, activeIndex);
  // Forward jumps are never offered: skipping ahead past validation is how a
  // wizard submits a half-finished record.
  const canJump = state === 'complete' && onValueChange !== undefined;

  return (
    <li
      aria-current={state === 'current' ? 'step' : undefined}
      // `grow`, not `flex-1`. `flex-1` is `flex: 1 1 0%`, which gives every step an
      // identical box regardless of label length — so "Publish" and "Lawful basis"
      // get the same width and the long one clips while the short one has room to
      // spare. `grow` sizes each step by its content and shares out only the slack.
      className={cn('flex min-w-0', isVertical ? 'items-start gap-3' : 'grow items-center gap-2')}
    >
      <StepMarker
        index={index}
        state={state}
        label={step.label}
        className={cn(scale.marker, markerStates[state])}
        onActivate={
          canJump
            ? () => {
                onValueChange(step.value);
              }
            : undefined
        }
      />

      <StepLabel
        step={step}
        state={state}
        size={size}
        isVertical={isVertical}
        messages={messages}
      />

      {/* The connector fills the space between markers, so it flips with `dir`. */}
      {!isVertical && !isLast && (
        <span
          aria-hidden
          className={cn('rounded-pill h-px min-w-4 flex-1', connectorTones[state])}
        />
      )}
    </li>
  );
}

/** The numbered disc. A completed step becomes a real button when it is navigable. */
function StepMarker({
  index,
  state,
  label,
  className,
  onActivate,
}: {
  index: number;
  state: StepState;
  label: string;
  className: string;
  onActivate?: (() => void) | undefined;
}) {
  const content = state === 'complete' ? Check : index + 1;
  const shared = cn('rounded-pill grid shrink-0 place-items-center border font-mono', className);

  if (onActivate === undefined) {
    return (
      <span aria-hidden className={shared}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onActivate}
      className={cn(
        shared,
        'focus-visible:ring-border-focus cursor-pointer outline-none focus-visible:ring-2',
        'focus-visible:ring-offset-bg-canvas focus-visible:ring-offset-2',
      )}
    >
      {content}
    </button>
  );
}
