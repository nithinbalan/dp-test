'use client';

/**
 * @tier organisms
 *
 * Composes Avatar, Badge, Button, IconButton, Divider atoms and the
 * LocaleSwitcher and ThemeToggle molecules. The account menu is a small
 * self-contained popover — see `isMenuOpen` below; there is no shared
 * Menu/Popover molecule yet, and this is the only place that needs one so far
 * (see docs/DESIGN_SYSTEM.md §4, composition over configuration).
 */
import { useState } from 'react';
import NextLink from 'next/link';
import { Bell, Building2, Calendar, HelpCircle, LogOut, Menu, Settings } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Badge } from '@atoms/Badge';
import { Divider } from '@atoms/Divider';
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';
import { LocaleSwitcher } from '@molecules/LocaleSwitcher';
import { ThemeToggle } from '@molecules/ThemeToggle';
import { cn } from '@shared/lib';
import type { AppTopbarMessages, AppTopbarProps } from './AppTopbar.types';

const DEFAULT_MESSAGES: AppTopbarMessages = {
  openNavLabel: 'Open navigation',
  tenantCaption: 'India tenant',
  enforcementCountdown: '{days} days to enforcement',
  notificationsLabel: 'Notifications',
  themeToggleLabel: 'Change theme',
  accountMenuLabel: 'Account menu',
  languageLabel: 'Language',
  configurationLabel: 'Configuration Studio',
  helpLabel: 'Help & DPDP guide',
  signOutLabel: 'Sign out',
};

function AccountMenuPanel({
  t,
  userName,
  userInitials,
  userRole,
  locale,
  onLocaleChange,
  onSignOut,
}: {
  t: AppTopbarMessages;
  userName: string;
  userInitials: string;
  userRole: string;
  locale: AppTopbarProps['locale'];
  onLocaleChange: AppTopbarProps['onLocaleChange'];
  onSignOut: (() => void) | undefined;
}) {
  return (
    <div
      role="menu"
      className="border-border-default bg-bg-surface rounded-surface absolute end-0 top-full z-50 mt-2 w-64 border p-3 shadow-lg"
    >
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <Avatar label={userName} initials={userInitials} tone="brand" />
        <div>
          <Text size="sm" weight="medium">
            {userName}
          </Text>
          <Text size="xs" tone="muted">
            {userRole}
          </Text>
        </div>
      </div>
      <Divider />
      <div className="flex items-center justify-between px-1 py-2">
        <Text size="xs" tone="muted">
          {t.languageLabel}
        </Text>
        <LocaleSwitcher
          current={locale}
          label={t.languageLabel}
          onValueChange={onLocaleChange}
          size="sm"
        />
      </div>
      <Divider />
      <NextLink
        href="/settings"
        role="menuitem"
        className="text-fg-default hover:bg-bg-subtle rounded-control mt-1 flex items-center gap-2 px-2 py-2 text-sm"
      >
        <Settings className="size-4" aria-hidden />
        {t.configurationLabel}
      </NextLink>
      <button
        type="button"
        role="menuitem"
        className="text-fg-default hover:bg-bg-subtle rounded-control flex w-full items-center gap-2 px-2 py-2 text-start text-sm"
      >
        <HelpCircle className="size-4" aria-hidden />
        {t.helpLabel}
      </button>
      <Divider />
      <button
        type="button"
        role="menuitem"
        onClick={onSignOut}
        className="text-danger-fg hover:bg-danger-subtle rounded-control mt-1 flex w-full items-center gap-2 px-2 py-2 text-start text-sm"
      >
        <LogOut className="size-4" aria-hidden />
        {t.signOutLabel}
      </button>
    </div>
  );
}

function TopbarActions({
  t,
  enforcementDaysRemaining,
  userName,
  userInitials,
  userRole,
  locale,
  onLocaleChange,
  onSignOut,
  onNotificationsClick,
}: {
  t: AppTopbarMessages;
  enforcementDaysRemaining: number;
  userName: string;
  userInitials: string;
  userRole: string;
  locale: AppTopbarProps['locale'];
  onLocaleChange: AppTopbarProps['onLocaleChange'];
  onSignOut: (() => void) | undefined;
  onNotificationsClick: (() => void) | undefined;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="ms-auto flex items-center gap-2">
      <Badge variant="soft" tone="neutral" startSlot={<Calendar className="size-3" />}>
        {t.enforcementCountdown.replace('{days}', String(enforcementDaysRemaining))}
      </Badge>

      <IconButton
        label={t.notificationsLabel}
        variant="ghost"
        size="sm"
        onClick={onNotificationsClick}
      >
        <Bell className="size-4" />
      </IconButton>

      <ThemeToggle size="sm" messages={{ label: t.themeToggleLabel }} />

      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label={t.accountMenuLabel}
          onClick={() => {
            setIsMenuOpen((current) => !current);
          }}
          className="rounded-control hover:bg-bg-subtle flex items-center gap-2 p-1"
        >
          <Avatar label={userName} initials={userInitials} size="sm" tone="brand" />
        </button>
        {isMenuOpen && (
          <>
            <div
              aria-hidden
              onClick={() => {
                setIsMenuOpen(false);
              }}
              className="fixed inset-0 z-40"
            />
            <AccountMenuPanel
              t={t}
              userName={userName}
              userInitials={userInitials}
              userRole={userRole}
              locale={locale}
              onLocaleChange={onLocaleChange}
              onSignOut={onSignOut}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function AppTopbar({
  orgName,
  orgLogoUrl,
  workspaceAddress,
  enforcementDaysRemaining,
  userName,
  userInitials,
  userRole,
  locale,
  onLocaleChange,
  onOpenMobileNav,
  onSignOut,
  onNotificationsClick,
  messages,
  className,
  testId,
}: AppTopbarProps) {
  const t = { ...DEFAULT_MESSAGES, ...messages };

  return (
    <header
      data-testid={testId}
      className={cn(
        'border-border-default bg-bg-surface flex items-center gap-3 border-b px-4 py-3',
        className,
      )}
    >
      <IconButton
        label={t.openNavLabel}
        variant="ghost"
        size="sm"
        onClick={onOpenMobileNav}
        className="lg:hidden"
      >
        <Menu className="size-4" />
      </IconButton>

      <div className="flex min-w-0 items-center gap-2">
        {orgLogoUrl !== undefined ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by a workspace-scoped route, not an asset next/image would optimise
          <img src={orgLogoUrl} alt="" className="size-4 shrink-0 rounded-xs object-cover" />
        ) : (
          <Building2 aria-hidden className="text-fg-subtle size-4 shrink-0" />
        )}
        <div className="min-w-0">
          <Text size="sm" weight="medium" isTruncated>
            {orgName}
          </Text>
          <Text size="2xs" tone="muted" isTruncated>
            {workspaceAddress} · {t.tenantCaption}
          </Text>
        </div>
      </div>

      <TopbarActions
        t={t}
        enforcementDaysRemaining={enforcementDaysRemaining}
        userName={userName}
        userInitials={userInitials}
        userRole={userRole}
        locale={locale}
        onLocaleChange={onLocaleChange}
        onSignOut={onSignOut}
        onNotificationsClick={onNotificationsClick}
      />
    </header>
  );
}
