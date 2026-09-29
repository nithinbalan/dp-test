/**
 * @tier molecules
 *
 * SVG circle pair (track + arc) plus Text for the centred number. The arc's
 * colour comes from `currentColor` — a `text-{tone}` class on the wrapper sets
 * it once for both the SVG stroke and (if a caller nests one) any icon.
 */
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { ScoreRingProps } from './ScoreRing.types';

/**
 * `size-*` utilities on the token spacing scale, not arbitrary pixel values —
 * 24/32/40 steps land on exactly 96/128/160px at the scale's 0.25rem step.
 */
const DIAMETER_CLASSES = {
  md: 'size-24',
  lg: 'size-32',
  xl: 'size-40',
} as const;

const VALUE_SIZES = {
  md: 'md',
  lg: 'lg',
  xl: 'lg',
} as const;

const STROKE_WIDTH = 10;
const RADIUS = 50 - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TONE_CLASSES = {
  brand: 'text-brand-solid',
  accent: 'text-accent-solid',
  success: 'text-success-solid',
  warning: 'text-warning-solid',
  danger: 'text-danger-solid',
  info: 'text-info-solid',
  neutral: 'text-fg-muted',
} as const;

export function ScoreRing({
  value,
  max = 100,
  label,
  valueLabel,
  description,
  size = 'lg',
  tone = 'brand',
  isOnInverse = false,
  className,
  testId,
}: ScoreRingProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const fraction = max === 0 ? 0 : clamped / max;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const percent = Math.round(fraction * 100);

  return (
    <div
      role="img"
      aria-label={valueLabel ?? `${label}: ${String(percent)}%`}
      data-testid={testId}
      className={cn(
        'relative inline-grid shrink-0 place-items-center',
        DIAMETER_CLASSES[size],
        className,
      )}
    >
      <svg viewBox="0 0 100 100" className={cn('-rotate-90', TONE_CLASSES[tone])}>
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-border-default"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="duration-slow ease-standard transition-all"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <Text as="div" size={VALUE_SIZES[size]} weight="bold" isMono>
            {percent}%
          </Text>
          {description !== undefined && (
            <Text
              as="div"
              size="2xs"
              tone={isOnInverse ? 'inverse' : 'muted'}
              className={cn('uppercase', isOnInverse && 'opacity-70')}
            >
              {description}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}
