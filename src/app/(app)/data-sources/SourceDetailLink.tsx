'use client';

/**
 * The "open this source" affordance. A real link rendered through Button's
 * `asChild`, not a button with a click handler: the detail view is a route, so
 * it has to be middle-clickable, copyable and reachable without JavaScript.
 * `IconButton` would be the closer fit but does not support `asChild`, so the
 * accessible name is supplied on the anchor instead.
 */
import NextLink from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@atoms/Button';
import { cn } from '@shared/lib';

export function SourceDetailLink({
  sourceId,
  label,
  variant = 'ghost',
  className,
}: {
  sourceId: string;
  label: string;
  variant?: 'ghost' | 'outline';
  className?: string;
}) {
  return (
    <Button asChild variant={variant} size="sm" className={cn('size-8.5 p-0', className)}>
      <NextLink href={`/data-sources/${sourceId}`} aria-label={label}>
        <ChevronRight className="size-4 rtl:-scale-x-100" />
      </NextLink>
    </Button>
  );
}
