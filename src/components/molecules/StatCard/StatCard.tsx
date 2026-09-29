/**
 * @tier molecules
 *
 * Dashboard metric tile. Composes Card, Text and Skeleton. Holds no data — the
 * page fetches, formats, and passes a finished string.
 */
import { Card } from '@atoms/Card';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { ReactNode } from 'react';
import type { StatCardProps } from './StatCard.types';

type StatTone = NonNullable<StatCardProps['tone']>;
type StatSize = NonNullable<StatCardProps['size']>;

/** Only the VALUE is toned. A toned label would make every tile shout. */
const valueTones = {
  neutral: 'text-fg-default',
  brand: 'text-brand-fg',
  accent: 'text-accent-fg',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
  info: 'text-info-fg',
} as const;

const valueSizes = {
  xs: 'text-md',
  sm: 'text-lg',
  md: 'text-xl',
} as const;

const skeletonHeights = {
  xs: 'h-5',
  sm: 'h-6',
  md: 'h-8',
} as const;

const cardSizes = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
} as const;

/**
 * Split out so the tile's render body stays a layout rather than a branch. Its
 * props are spelled out rather than derived with `Required<Pick<…>>`: under
 * `exactOptionalPropertyTypes` that helper strips the `?` but keeps the explicit
 * `| undefined`, so the lookups below would still be indexed by a maybe-undefined
 * key.
 */
function Value({
  value,
  tone,
  size,
  isLoading,
  loadingLabel,
}: {
  value: ReactNode;
  tone: StatTone;
  size: StatSize;
  isLoading: boolean;
  loadingLabel: string;
}) {
  if (isLoading) {
    return (
      <>
        <Skeleton className={cn('w-20', skeletonHeights[size])} />
        <span className="sr-only">{loadingLabel}</span>
      </>
    );
  }
  return (
    <span className={cn('leading-tight font-bold', valueSizes[size], valueTones[tone])}>
      {value}
    </span>
  );
}

export function StatCard({
  label,
  value,
  description,
  tone = 'neutral',
  size = 'md',
  startSlot,
  endSlot,
  isInteractive = false,
  isLoading = false,
  loadingLabel = 'Loading',
  className,
  testId,
}: StatCardProps) {
  return (
    <Card
      size={cardSizes[size]}
      isInteractive={isInteractive}
      aria-busy={isLoading || undefined}
      testId={testId}
      className={cn('flex flex-col gap-1', className)}
    >
      <div className="flex items-baseline gap-2">
        <Value
          value={value}
          tone={tone}
          size={size}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
        />
        {endSlot !== undefined && <span className="ms-auto shrink-0">{endSlot}</span>}
      </div>

      <div className="flex items-center gap-1.5">
        {startSlot !== undefined && (
          <span aria-hidden className="text-fg-subtle grid shrink-0 place-items-center">
            {startSlot}
          </span>
        )}
        <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
          {label}
        </Text>
      </div>

      {description !== undefined && (
        <Text as="span" size="xs" tone="muted">
          {description}
        </Text>
      )}
    </Card>
  );
}
