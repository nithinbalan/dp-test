/**
 * @tier molecules
 *
 * Breadcrumb trail. Composes the Link atom; the separator is an `aria-hidden`
 * list decoration, because a screen reader already announces list position and
 * would otherwise read "slash" between every crumb.
 */
import { Link } from '@atoms/Link';
import { cn } from '@shared/lib';
import type { BreadcrumbsProps } from './Breadcrumbs.types';

const sizes = {
  '2xs': 'text-2xs gap-1.5',
  xs: 'text-xs gap-2',
  sm: 'text-sm gap-2',
} as const;

/** Mirrors in RTL, because a chevron pointing "forward" is direction-dependent. */
const DefaultSeparator = (
  <svg viewBox="0 0 16 16" fill="none" className="size-3 rtl:-scale-x-100">
    <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Breadcrumbs({
  items,
  label = 'Breadcrumb',
  separator = DefaultSeparator,
  size = 'sm',
  className,
  testId,
}: BreadcrumbsProps) {
  return (
    <nav aria-label={label} data-testid={testId} className={className}>
      <ol className={cn('text-fg-muted flex flex-wrap items-center', sizes[size])}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${String(index)}`}
              className={cn('flex items-center', sizes[size])}
            >
              {isLast || item.href === undefined ? (
                // The current page is text, not a link. `aria-current` is what
                // says which crumb you are standing on.
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="text-fg-default font-medium"
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} tone="muted" size={size}>
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <span aria-hidden className="text-fg-subtle grid place-items-center">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
