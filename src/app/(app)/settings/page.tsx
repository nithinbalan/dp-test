import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, validateSession } from '@server/auth';
import { env } from '@shared/config';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { PEOPLE } from '@shared/mock/people';
import { resolveSettingsMessages } from './SettingsMessages';
import { SettingsView } from './SettingsView';

/**
 * Resolves the same way `(app)/layout.tsx` does, rather than reading the
 * `x-workspace-slug` header directly — the header carries only the host's raw
 * slug, and the session's `activeWorkspace.slug` (which can differ, e.g. after
 * a workspace switch) is what the topbar actually displays. Re-resolving here
 * keeps the two displays from ever disagreeing at the cost of one extra
 * session lookup, already paid on every page in this layout.
 */
async function readTenantAddress(): Promise<string> {
  const rawToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) redirect('/login');

  const workspaceSlug = (await headers()).get('x-workspace-slug') ?? undefined;
  const sessionResult = await validateSession(rawToken, workspaceSlug);
  if (!sessionResult.ok) redirect('/login');

  return `${sessionResult.value.activeWorkspace.slug}.${env.APP_BASE_DOMAIN}`;
}

export default async function SettingsPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'settings');
  const tenantAddress = await readTenantAddress();

  const people = PEOPLE.map((person) => ({
    id: person.id,
    name: person.name,
    initials: person.initials,
    detail: `${person.role} · ${person.department}`,
    group: person.department,
  }));

  return (
    <SettingsView
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      people={people}
      tenantAddress={tenantAddress}
      t={resolveSettingsMessages(t)}
    />
  );
}
