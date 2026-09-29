/**
 * @tier molecules
 *
 * Nothing-here state. Composes Card, Heading and Text. Holds no state and knows
 * nothing about why the region is empty — the caller decides which of the three
 * empties this is and passes the matching copy and action.
 */
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { EmptyStateProps } from './EmptyState.types';

const discTones = {
  brand: 'bg-brand-subtle text-brand-fg',
  accent: 'bg-accent-subtle text-accent-fg',
  neutral: 'bg-bg-subtle text-fg-subtle',
  warning: 'bg-warning-subtle text-warning-fg',
  danger: 'bg-danger-subtle text-danger-fg',
  info: 'bg-info-subtle text-info-fg',
} as const;

const sizes = {
  sm: { pad: 'py-8', disc: 'size-10 text-lg', gap: 'gap-2' },
  md: { pad: 'py-16', disc: 'size-20 text-3xl', gap: 'gap-3' },
} as const;

export function EmptyState({
  label,
  description,
  startSlot,
  actionSlot,
  children,
  tone = 'brand',
  variant = 'outline',
  size = 'md',
  className,
  testId,
}: EmptyStateProps) {
  const scale = sizes[size];

  const body = (
    <div className={cn('flex flex-col items-center px-8 text-center', scale.pad, scale.gap)}>
      {startSlot !== undefined && (
        <span
          aria-hidden
          className={cn('rounded-pill mb-1 grid place-items-center', scale.disc, discTones[tone])}
        >
          {startSlot}
        </span>
      )}

      <Heading level={3} size={size === 'sm' ? 'md' : 'lg'}>
        {label}
      </Heading>

      {description !== undefined && (
        <Text size="sm" tone="muted" className="max-w-md">
          {description}
        </Text>
      )}

      {actionSlot !== undefined && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actionSlot}</div>
      )}

      {children}
    </div>
  );

  // `ghost` exists so a table can put this in its own body without stacking a
  // second border and radius inside the one it already draws.
  if (variant === 'ghost') {
    return (
      <div data-testid={testId} className={className}>
        {body}
      </div>
    );
  }

  return (
    <Card size="none" testId={testId} className={cn('border-dashed', className)}>
      {body}
    </Card>
  );
}
