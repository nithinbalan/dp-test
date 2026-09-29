'use client';

/** Grouped section switcher for Configuration Studio — mirrors the prototype's `.cs-nav`. */
import {
  Bell,
  Building,
  Building2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Globe2,
  Handshake,
  Inbox,
  Laptop,
  ListChecks,
  Lock,
  Map as MapIcon,
  Network,
  PlugZap,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Select } from '@atoms/Select';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { SettingsMessages } from './SettingsMessages';

export type SettingsSectionKey =
  | 'workspace'
  | 'access'
  | 'notify'
  | 'gap'
  | 'sources'
  | 'datamap'
  | 'endpoints'
  | 'ropa'
  | 'notices'
  | 'consent'
  | 'dsr'
  | 'breach'
  | 'transfers'
  | 'thirdparty'
  | 'controls'
  | 'dpia'
  | 'risks'
  | 'actions'
  | 'people'
  | 'department'
  | 'questionnaire';

type NavGroupKey =
  | 'groupGeneral'
  | 'groupOverview'
  | 'groupDataDiscovery'
  | 'groupDataFoundation'
  | 'groupPrivacyOperations'
  | 'groupGovernance'
  | 'groupPeopleAwareness'
  | 'groupMaster';

type NavEntry =
  | { group: NavGroupKey }
  | { key: SettingsSectionKey; icon: LucideIcon; labelKey: keyof SettingsMessages };

/** Order and grouping match the prototype's `CS_SECS` exactly. */
const NAV_ENTRIES: readonly NavEntry[] = [
  { group: 'groupGeneral' },
  { key: 'workspace', icon: Building2, labelKey: 'tabWorkspace' },
  { key: 'access', icon: Lock, labelKey: 'navAccess' },
  { key: 'notify', icon: Bell, labelKey: 'tabNotifications' },
  { group: 'groupMaster' },
  { key: 'department', icon: Building, labelKey: 'navDepartment' },
  { key: 'questionnaire', icon: ClipboardList, labelKey: 'navQuestionnaire' },
  { group: 'groupOverview' },
  { key: 'gap', icon: ClipboardCheck, labelKey: 'navGap' },
  { group: 'groupDataDiscovery' },
  { key: 'sources', icon: PlugZap, labelKey: 'navSources' },
  { key: 'datamap', icon: MapIcon, labelKey: 'navDatamap' },
  { key: 'endpoints', icon: Laptop, labelKey: 'navEndpoints' },
  { group: 'groupDataFoundation' },
  { key: 'ropa', icon: Network, labelKey: 'navRopa' },
  { group: 'groupPrivacyOperations' },
  { key: 'notices', icon: FileText, labelKey: 'navNotices' },
  { key: 'consent', icon: CheckSquare, labelKey: 'navConsent' },
  { key: 'dsr', icon: Inbox, labelKey: 'navDsr' },
  { key: 'breach', icon: Siren, labelKey: 'navBreach' },
  { key: 'transfers', icon: Globe2, labelKey: 'navTransfers' },
  { group: 'groupGovernance' },
  { key: 'thirdparty', icon: Handshake, labelKey: 'navThirdparty' },
  { key: 'controls', icon: ShieldCheck, labelKey: 'navControls' },
  { key: 'dpia', icon: ClipboardList, labelKey: 'navDpia' },
  { key: 'risks', icon: ShieldAlert, labelKey: 'navRisks' },
  { key: 'actions', icon: ListChecks, labelKey: 'navActions' },
  { group: 'groupPeopleAwareness' },
  { key: 'people', icon: Users, labelKey: 'navPeople' },
];

/** So the panel header can show the same icon + name as the nav button, without a second lookup table. */
export const SETTINGS_SECTIONS: readonly {
  key: SettingsSectionKey;
  icon: LucideIcon;
  labelKey: keyof SettingsMessages;
}[] = NAV_ENTRIES.filter(
  (entry): entry is Extract<NavEntry, { key: SettingsSectionKey }> => 'key' in entry,
);

function buildMobileOptions(t: SettingsMessages): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  let currentGroupLabel = '';
  NAV_ENTRIES.forEach((entry) => {
    if ('group' in entry) {
      currentGroupLabel = t[entry.group];
    } else {
      options.push({
        value: entry.key,
        label: `${currentGroupLabel} — ${t[entry.labelKey]}`,
      });
    }
  });
  return options;
}

export function SettingsNav({
  active,
  onSelect,
  navLabel,
  t,
}: {
  active: SettingsSectionKey;
  onSelect: (key: SettingsSectionKey) => void;
  navLabel: string;
  t: SettingsMessages;
}) {
  const mobileOptions = buildMobileOptions(t);

  return (
    <>
      <div className="mb-4 block lg:hidden">
        <Select
          aria-label={navLabel}
          value={active}
          onValueChange={(val) => {
            onSelect(val as SettingsSectionKey);
          }}
          options={mobileOptions}
          fullWidth
        />
      </div>
      <nav
        aria-label={navLabel}
        className="border-border-default bg-bg-surface rounded-surface scrollbar-surface sticky top-0 hidden max-h-dvh flex-col gap-0.5 overflow-y-auto border p-2.5 lg:flex"
      >
        {NAV_ENTRIES.map((entry, index) => {
          if ('group' in entry) {
            return (
              <Text
                key={entry.group}
                as="div"
                size="2xs"
                tone="muted"
                isMono
                className={cn(
                  'px-3 pt-3 pb-1.5 tracking-widest uppercase',
                  index === 0 && 'pt-1.5',
                )}
              >
                {t[entry.group]}
              </Text>
            );
          }
          const Icon = entry.icon;
          const isSelected = active === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => {
                onSelect(entry.key);
              }}
              className={cn(
                'rounded-control flex items-center gap-2.5 px-3 py-2 text-start text-sm font-medium',
                isSelected ? 'bg-bg-inverse text-fg-inverse' : 'text-fg-default hover:bg-bg-subtle',
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  'size-4 shrink-0',
                  isSelected ? 'text-accent-solid' : 'text-fg-subtle',
                )}
              />
              {t[entry.labelKey]}
            </button>
          );
        })}
      </nav>
    </>
  );
}
