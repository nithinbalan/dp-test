'use client';

/**
 * Owns the cross-organism state the shell needs: whether mobile sidebar is open,
 * locale changes, and sign-out action.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppSidebarMessages, SidebarNavGroup, SidebarNavItem } from '@organisms/AppSidebar';
import { AppSidebar } from '@organisms/AppSidebar';
import type { AppTopbarMessages } from '@organisms/AppTopbar';
import { AppTopbar } from '@organisms/AppTopbar';
import { AppShell } from '@templates/AppShell';
import { ToastProvider, useSignOut } from '@shared/hooks';
import { LOCALE_RESOLUTION, type Locale } from '@shared/types/locale';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type AppShellClientProps = {
  locale: Locale;
  navGroups: SidebarNavGroup[];
  aiItem: SidebarNavItem;
  sidebarMessages: Partial<AppSidebarMessages>;
  topbarMessages: Partial<AppTopbarMessages>;
  orgName: string;
  orgLogoUrl?: string | undefined;
  workspaceAddress: string;
  enforcementDaysRemaining: number;
  userName: string;
  userInitials: string;
  userRole: string;
  children: React.ReactNode;
};

export function AppShellClient({
  locale,
  navGroups,
  aiItem,
  sidebarMessages,
  topbarMessages,
  orgName,
  orgLogoUrl,
  workspaceAddress,
  enforcementDaysRemaining,
  userName,
  userInitials,
  userRole,
  children,
}: AppShellClientProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const router = useRouter();
  const signOutMutation = useSignOut();

  const handleLocaleChange = (next: Locale) => {
    document.cookie = `${LOCALE_RESOLUTION.cookieName}=${next}; path=/; max-age=${String(COOKIE_MAX_AGE)}; samesite=lax`;
    router.refresh();
  };

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <ToastProvider>
      <AppShell
        sidebarSlot={
          <AppSidebar
            groups={navGroups}
            aiItem={aiItem}
            isMobileOpen={isMobileNavOpen}
            onCloseMobile={() => {
              setIsMobileNavOpen(false);
            }}
            messages={sidebarMessages}
          />
        }
        topbarSlot={
          <AppTopbar
            orgName={orgName}
            orgLogoUrl={orgLogoUrl}
            workspaceAddress={workspaceAddress}
            enforcementDaysRemaining={enforcementDaysRemaining}
            userName={userName}
            userInitials={userInitials}
            userRole={userRole}
            locale={locale}
            onLocaleChange={handleLocaleChange}
            onOpenMobileNav={() => {
              setIsMobileNavOpen(true);
            }}
            onSignOut={() => {
              void handleSignOut();
            }}
            messages={topbarMessages}
          />
        }
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
