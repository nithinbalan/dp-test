/**
 * @tier molecules
 *
 * Composes Badge, Heading and Text atoms into the standard module page head.
 */
import { Badge } from '@atoms/Badge';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { PageHeaderProps } from './PageHeader.types';

export function PageHeader({
  refTag,
  label,
  description,
  actionSlot,
  className,
  testId,
}: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}
      data-testid={testId}
    >
      <div className="flex flex-col gap-1.5">
        {refTag !== undefined && (
          <Badge variant="soft" tone="brand" size="sm" className="rounded-control mb-1 w-fit">
            {refTag}
          </Badge>
        )}
        <Heading level={1} size="xl">
          {label}
        </Heading>
        {description !== undefined && (
          <Text size="sm" tone="muted" className="max-w-2xl">
            {description}
          </Text>
        )}
      </div>
      {actionSlot !== undefined && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actionSlot}</div>
      )}
    </div>
  );
}
