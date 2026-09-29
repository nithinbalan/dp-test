'use client';

/**
 * @tier organisms
 *
 * Composes Badge, IconButton and Input atoms plus SearchInput, wired to
 * `next/link` and `usePathname()` for routing — the one place in this tier
 * that is allowed to know about the router (see AppSidebar.types.ts).
 */
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { AppSidebarMessages, AppSidebarProps, SidebarNavItem } from './AppSidebar.types';

const DEFAULT_MESSAGES: AppSidebarMessages = {
  brandNamePrimary: 'Jethur',
  brandNameAccent: 'DPDP',
  brandCaption: 'DPDP compliance platform',
  searchPlaceholder: 'Search modules, records…',
  poweredBy: 'Powered by Jethur',
  closeLabel: 'Close navigation',
};

function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navIconClassName(isActive: boolean): string {
  return isActive ? 'shrink-0 text-accent-solid' : 'shrink-0';
}

function NavRow({
  item,
  isActive,
  isHighlighted = false,
}: {
  item: SidebarNavItem;
  isActive: boolean;
  isHighlighted?: boolean;
}) {
  return (
    <NextLink
      href={item.href}
      className={cn(
        'rounded-control duration-fast ease-standard flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
        isActive && 'bg-brand-solid text-fg-on-brand font-semibold',
        !isActive &&
          isHighlighted &&
          // `to-r`/`to-l` is a physical direction, not a logical one — CSS has no
          // `to inline-end` gradient keyword with reliable support yet, so this
          // mirrors the same way `rtl:-scale-x-100` does for a chevron.
          'from-accent-solid/10 border-accent-solid/25 text-accent-solid hover:from-accent-solid/15 hover:to-accent-solid/15 border bg-linear-to-r to-transparent font-semibold rtl:bg-linear-to-l',
        !isActive &&
          !isHighlighted &&
          'text-fg-inverse/70 hover:bg-fg-inverse/10 hover:text-fg-inverse font-medium',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span aria-hidden className={navIconClassName(isActive)}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && (
        <Badge
          size="xs"
          variant={isHighlighted ? 'solid' : 'soft'}
          tone={isActive || isHighlighted ? 'accent' : 'neutral'}
        >
          {item.badge}
        </Badge>
      )}
    </NextLink>
  );
}

function SidebarHeader({
  t,
  onCloseMobile,
}: {
  t: AppSidebarMessages;
  onCloseMobile: (() => void) | undefined;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="bg-bg-inverse-subtle text-accent-solid rounded-control grid size-8 shrink-0 place-items-center text-sm font-bold">
          J
        </span>
        <div>
          <Text size="sm" weight="bold" tone="inverse">
            {t.brandNamePrimary}
            <span className="text-accent-solid">{t.brandNameAccent}</span>
          </Text>
          {/* `fg-inverse-subtle` isn't in Text's tone vocabulary (that enum is
              emphasis-only, not a fixed brand colour) — a plain element avoids
              stacking a conflicting colour utility onto the one `tone` already
              sets on this element (`cn()` doesn't merge; see atoms/CLAUDE.md). */}
          <p className="text-fg-inverse-subtle text-2xs font-mono uppercase">{t.brandCaption}</p>
        </div>
      </div>
      {onCloseMobile && (
        <IconButton
          label={t.closeLabel}
          variant="ghost"
          size="sm"
          onClick={onCloseMobile}
          className="lg:hidden"
        >
          <X className="text-fg-inverse size-4" />
        </IconButton>
      )}
    </div>
  );
}

export function AppSidebar({
  groups,
  aiItem,
  isMobileOpen = false,
  onCloseMobile,
  messages,
  className,
  testId,
}: AppSidebarProps) {
  const pathname = usePathname();
  const t = { ...DEFAULT_MESSAGES, ...messages };

  return (
    <>
      {isMobileOpen && (
        <div
          aria-hidden
          onClick={onCloseMobile}
          className="bg-fg-default/50 fixed inset-0 z-40 lg:hidden"
        />
      )}
      <aside
        data-testid={testId}
        className={cn(
          'bg-bg-inverse scrollbar-inverse w-64 flex-col overflow-y-auto p-4',
          isMobileOpen ? 'fixed inset-y-0 start-0 z-50 flex' : 'hidden',
          'lg:static lg:z-auto lg:flex',
          className,
        )}
      >
        <SidebarHeader t={t} onCloseMobile={onCloseMobile} />

        <div className="border-border-inverse bg-bg-inverse-subtle rounded-control focus-within:ring-accent-solid mb-4 flex items-center gap-2 border px-3 py-2 focus-within:ring-2">
          <Search aria-hidden className="text-fg-inverse-subtle size-4 shrink-0" />
          <input
            type="search"
            placeholder={t.searchPlaceholder}
            className="text-fg-inverse placeholder:text-fg-inverse-subtle w-full bg-transparent text-sm outline-none"
          />
        </div>

        <NavRow item={aiItem} isActive={isActiveHref(pathname, aiItem.href)} isHighlighted />

        <nav className="mt-4 flex flex-1 flex-col gap-4">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="text-fg-inverse-subtle text-2xs px-3 font-mono tracking-widest uppercase">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavRow key={item.href} item={item} isActive={isActiveHref(pathname, item.href)} />
              ))}
            </div>
          ))}
        </nav>

        <p className="text-fg-inverse-subtle border-border-inverse text-2xs mt-4 border-t pt-3 font-mono">
          {t.poweredBy}
        </p>
      </aside>
    </>
  );
}
