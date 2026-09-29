import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEmployees } from '@api/employees/service';
import { getNotices } from '@api/notices/service';
import { SESSION_COOKIE_NAME, validateSession } from '@server/auth';
import type { WorkspaceContext } from '@server/workspace';
import { env } from '@shared/config';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { daysUntilEnforcement } from '@shared/mock/workspace';
import { AppShellClient } from './AppShellClient';
import { buildAiNavItem, buildNavGroups, type NavBadgeCounts } from './nav-config';

/**
 * Shell for every signed-in route. A Server Component resolving locale, copy,
 * user session, and active workspace context.
 *
 * Middleware only gates on the session cookie's *presence* (see src/middleware.ts) —
 * authorization happens here, in the app layer, per docs/WORKSPACE_ISOLATION.md §3.
 * A missing or invalid/expired session must deny access, not render the shell with
 * placeholder data: that would be a fail-open path past every other route's guard.
 * See docs/SECURITY_HYGIENE.md §5.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'app');
  const tc = getTranslator(locale, 'common');

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) {
    redirect('/login');
  }

  const headerStore = await headers();
  const workspaceSlug = headerStore.get('x-workspace-slug') ?? undefined;

  const sessionResult = await validateSession(rawToken, workspaceSlug);
  if (!sessionResult.ok) {
    redirect('/login');
  }

  const { user, activeWorkspace } = sessionResult.value;

  const workspaceContext: WorkspaceContext = {
    workspaceId: activeWorkspace.id,
    schema: activeWorkspace.schemaName,
    actorId: user.id,
    role: activeWorkspace.role,
  };
  const [employees, notices] = await Promise.all([
    getEmployees(workspaceContext),
    getNotices(workspaceContext),
  ]);
  const navBadgeCounts: NavBadgeCounts = {
    '/employees': employees.employees.length,
    '/notices': notices.notices.length,
  };

  const userName = user.fullName;
  const userInitials =
    user.fullName
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  const userRole = activeWorkspace.role.charAt(0).toUpperCase() + activeWorkspace.role.slice(1);
  const orgName = activeWorkspace.legalName;
  const orgLogoUrl = activeWorkspace.logoUrl ?? undefined;
  const workspaceAddress = `${activeWorkspace.slug}.${env.APP_BASE_DOMAIN}`;

  return (
    <AppShellClient
      locale={locale}
      navGroups={buildNavGroups(t, navBadgeCounts)}
      aiItem={buildAiNavItem(t)}
      sidebarMessages={{
        brandNamePrimary: t('brandNamePrimary'),
        brandNameAccent: t('brandNameAccent'),
        brandCaption: t('brandCaption'),
        searchPlaceholder: t('searchPlaceholder'),
        poweredBy: t('poweredBy'),
        closeLabel: t('closeNavLabel'),
      }}
      topbarMessages={{
        openNavLabel: t('openNavLabel'),
        tenantCaption: t('tenantCaption'),
        enforcementCountdown: t('enforcementCountdown'),
        notificationsLabel: t('notificationsLabel'),
        themeToggleLabel: tc('changeTheme'),
        accountMenuLabel: t('accountMenuLabel'),
        languageLabel: t('languageLabel'),
        configurationLabel: t('configurationLabel'),
        helpLabel: t('helpLabel'),
        signOutLabel: t('signOutLabel'),
      }}
      orgName={orgName}
      orgLogoUrl={orgLogoUrl}
      workspaceAddress={workspaceAddress}
      enforcementDaysRemaining={daysUntilEnforcement()}
      userName={userName}
      userInitials={userInitials}
      userRole={userRole}
    >
      {children}
    </AppShellClient>
  );
}
