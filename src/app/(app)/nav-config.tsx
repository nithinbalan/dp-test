/**
 * Sidebar structure for the signed-in app. Page-local, like `LocaleControls` —
 * not a design-system component, just data `AppSidebar` renders. Icons are
 * fixed per item (not copy); labels are resolved by the caller from the
 * `app` message catalogue, so this file only maps hrefs to translation keys.
 *
 * Icons come from `@tabler/icons-react`, not the `lucide-react` set every other
 * component in the design system uses — deliberately: the sidebar's icon-per-item
 * mapping is specified glyph-for-glyph against the source product design (each
 * `Icon*` name below matches a `ti-*` class there exactly), and no `lucide-react`
 * icon reproduces those glyphs. Keep this substitution scoped to this file; it is
 * not a signal to introduce a second icon library anywhere else.
 */
import type { ComponentType } from 'react';
import type { Route } from 'next';
import {
  IconAffiliate,
  IconAlertHexagon,
  IconAlertSquareRounded,
  IconCheckbox,
  IconCheckupList,
  IconClipboardData,
  IconDatabaseImport,
  IconDeviceLaptop,
  IconFileText,
  IconInbox,
  IconLayoutDashboard,
  IconListCheck,
  IconMap2,
  IconPlugConnected,
  IconSchool,
  IconSettings,
  IconShieldCheck,
  IconSitemap,
  IconSparkles,
  IconUrgent,
  IconUsers,
  IconWorldShare,
} from '@tabler/icons-react';
import type { Translate } from '@shared/lib';
import type { MessageKeys } from '@shared/types/messages';
import type { SidebarNavGroup, SidebarNavItem } from '@organisms/AppSidebar';

type NavItemDef = {
  href: Route;
  icon: ComponentType<{ className?: string }>;
  key: MessageKeys['app'];
};
type NavGroupDef = { groupKey: MessageKeys['app']; items: NavItemDef[] };

const AI_ITEM_DEF: NavItemDef = { href: '/ai', icon: IconSparkles, key: 'navAiLabel' };

const GROUP_DEFS: NavGroupDef[] = [
  {
    groupKey: 'navGroupOverview',
    items: [
      { href: '/dashboard', icon: IconLayoutDashboard, key: 'navDashboard' },
      { href: '/readiness', icon: IconCheckupList, key: 'navGapAssessment' },
    ],
  },
  {
    groupKey: 'navGroupDataDiscovery',
    items: [
      { href: '/data-sources', icon: IconPlugConnected, key: 'navDataSources' },
      { href: '/data-map', icon: IconMap2, key: 'navDataMap' },
      { href: '/endpoints', icon: IconDeviceLaptop, key: 'navEndpoints' },
    ],
  },
  {
    groupKey: 'navGroupDataFoundation',
    items: [
      { href: '/collection', icon: IconDatabaseImport, key: 'navCollectionHub' },
      { href: '/ropa', icon: IconSitemap, key: 'navRopa' },
    ],
  },
  {
    groupKey: 'navGroupPrivacyOps',
    items: [
      { href: '/notices', icon: IconFileText, key: 'navNoticeManager' },
      { href: '/consent', icon: IconCheckbox, key: 'navConsentLedger' },
      { href: '/dsr', icon: IconInbox, key: 'navDsrRequests' },
      { href: '/breach', icon: IconUrgent, key: 'navBreachManagement' },
      { href: '/transfers', icon: IconWorldShare, key: 'navCrossBorderTransfers' },
    ],
  },
  {
    groupKey: 'navGroupGovernance',
    items: [
      { href: '/third-party', icon: IconAffiliate, key: 'navThirdPartyRisk' },
      { href: '/controls', icon: IconShieldCheck, key: 'navControls' },
      { href: '/dpia', icon: IconClipboardData, key: 'navDpia' },
      { href: '/risks', icon: IconAlertHexagon, key: 'navRiskRegister' },
      { href: '/actions', icon: IconListCheck, key: 'navActionPlans' },
      { href: '/issues', icon: IconAlertSquareRounded, key: 'navIssueRegister' },
    ],
  },
  {
    groupKey: 'navGroupPeople',
    items: [
      { href: '/employees', icon: IconUsers, key: 'navEmployeesLabel' },
      { href: '/academy', icon: IconSchool, key: 'navAcademy' },
    ],
  },
  {
    groupKey: 'navGroupAdmin',
    items: [{ href: '/settings', icon: IconSettings, key: 'navConfigurationStudio' }],
  },
];

function buildItem(def: NavItemDef, t: Translate<'app'>): SidebarNavItem {
  const Icon = def.icon;
  return { href: def.href, label: t(def.key), icon: <Icon className="size-4" /> };
}

export function buildAiNavItem(t: Translate<'app'>): SidebarNavItem {
  return { ...buildItem(AI_ITEM_DEF, t), badge: t('navAiTag') };
}

/** Live counts to badge onto a nav item, keyed by its href — e.g. the
 * workspace's current employee headcount, or how many notices exist. Matches
 * the prototype's `sbBadge()`: a count of zero omits the badge entirely
 * rather than showing "0". */
export type NavBadgeCounts = Partial<Record<string, number>>;

export function buildNavGroups(
  t: Translate<'app'>,
  badgeCounts: NavBadgeCounts = {},
): SidebarNavGroup[] {
  return GROUP_DEFS.map((group) => ({
    label: t(group.groupKey),
    items: group.items.map((item) => {
      const built = buildItem(item, t);
      const count = badgeCounts[item.href];
      return count !== undefined && count > 0 ? { ...built, badge: String(count) } : built;
    }),
  }));
}
