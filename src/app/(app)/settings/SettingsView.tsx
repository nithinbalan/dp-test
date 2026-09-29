'use client';

/** Owns the draft settings state and active-section selection for Configuration Studio. */
import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import type { PersonOption } from '@molecules/PeoplePicker';
import { useToast } from '@shared/hooks';
import { AccessControlPanel } from './AccessControlPanel';
import { AssessmentPanel } from './AssessmentPanel';
import { AwarenessPanel } from './AwarenessPanel';
import { DepartmentsMasterList } from './DepartmentsMasterList';
import { NotificationsPanel } from './NotificationsPanel';
import { SectionsMasterList } from './SectionsMasterList';
import type { SettingsMessages } from './SettingsMessages';
import { SETTINGS_SECTIONS, SettingsNav, type SettingsSectionKey } from './SettingsNav';
import { SettingsPanelHeader } from './SettingsPanelHeader';
import { INITIAL_SETTINGS, type SettingsState } from './SettingsState';
import { WorkspaceSettingsPanel } from './WorkspaceSettingsPanel';

/** Sections with a row-based panel + the standard save bar, driven by local mock
 * state. Workspace and Access Control each own their own save flow (the former
 * is real, DB-backed data; the latter has no single "dirty" draft), and every
 * other nav entry falls back to the "coming soon" empty state. */
const ROW_SECTION_HEADLINES: Partial<
  Record<
    SettingsSectionKey,
    { headline: keyof SettingsMessages; description: keyof SettingsMessages }
  >
> = {
  notify: { headline: 'notificationsTitle', description: 'notificationsDescription' },
  gap: { headline: 'assessmentTitle', description: 'assessmentDescription' },
  people: { headline: 'awarenessTitle', description: 'awarenessDescription' },
  department: { headline: 'departmentTitle', description: 'departmentDescription' },
  questionnaire: { headline: 'sectionsTitle', description: 'sectionsDescription' },
};

const WORKSPACE_HEADLINE = {
  headline: 'workspaceTitle',
  description: 'workspaceDescription',
} as const;

function renderRowPanel(
  section: SettingsSectionKey,
  state: SettingsState,
  onChange: (patch: Partial<SettingsState>) => void,
  people: readonly PersonOption[],
  t: SettingsMessages,
): ReactNode | undefined {
  if (section === 'notify') return <NotificationsPanel state={state} onChange={onChange} t={t} />;
  if (section === 'gap')
    return <AssessmentPanel state={state} onChange={onChange} people={people} t={t} />;
  if (section === 'people') return <AwarenessPanel state={state} onChange={onChange} t={t} />;
  return undefined;
}

function SectionHeader({ section, t }: { section: SettingsSectionKey; t: SettingsMessages }) {
  const meta = SETTINGS_SECTIONS.find((entry) => entry.key === section);
  if (meta === undefined) return null;
  const Icon = meta.icon;
  const rowMeta = section === 'workspace' ? WORKSPACE_HEADLINE : ROW_SECTION_HEADLINES[section];
  const isAccess = section === 'access';
  const headline = isAccess ? t.accessTitle : rowMeta ? t[rowMeta.headline] : undefined;
  const description = isAccess ? t.accessDescription : rowMeta ? t[rowMeta.description] : undefined;

  if (headline === undefined || description === undefined) return null;

  return (
    <SettingsPanelHeader
      icon={<Icon className="size-5" />}
      name={t[meta.labelKey]}
      headline={headline}
      description={description}
    />
  );
}

function SettingsSectionBody({
  section,
  state,
  onChange,
  people,
  tenantAddress,
  isDirty,
  onSave,
  t,
}: {
  section: SettingsSectionKey;
  state: SettingsState;
  onChange: (patch: Partial<SettingsState>) => void;
  people: readonly PersonOption[];
  tenantAddress: string;
  isDirty: boolean;
  onSave: () => void;
  t: SettingsMessages;
}) {
  const rowPanel = renderRowPanel(section, state, onChange, people, t);
  const saveLabel = section === 'workspace' ? t.saveWorkspaceCta : t.saveCta;

  if (section === 'access') {
    return (
      <>
        <SectionHeader section={section} t={t} />
        <AccessControlPanel t={t} />
      </>
    );
  }
  if (section === 'department') {
    return (
      <>
        <SectionHeader section={section} t={t} />
        <DepartmentsMasterList t={t} />
      </>
    );
  }
  if (section === 'questionnaire') {
    return (
      <>
        <SectionHeader section={section} t={t} />
        <SectionsMasterList t={t} />
      </>
    );
  }
  if (section === 'workspace') {
    return (
      <>
        <SectionHeader section={section} t={t} />
        <WorkspaceSettingsPanel tenantAddress={tenantAddress} t={t} />
      </>
    );
  }
  if (rowPanel !== undefined) {
    return (
      <>
        <SectionHeader section={section} t={t} />
        <Card variant="outline">{rowPanel}</Card>
        <div className="flex items-center justify-between gap-4">
          <Text size="xs" tone="muted" isMono className="tracking-wide uppercase">
            {t.footerHint}
          </Text>
          <Button
            tone="brand"
            size="sm"
            isDisabled={!isDirty}
            startSlot={<Check className="size-4" />}
            onClick={onSave}
          >
            {saveLabel}
          </Button>
        </div>
      </>
    );
  }
  return (
    <EmptyState label={t.comingSoonTitle} description={t.comingSoonDescription} variant="outline" />
  );
}

export function SettingsView({
  pageLabel,
  pageRefTag,
  pageDescription,
  people,
  tenantAddress,
  t,
}: {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  people: readonly PersonOption[];
  tenantAddress: string;
  t: SettingsMessages;
}) {
  const [section, setSection] = useState<SettingsSectionKey>('workspace');
  const [state, setState] = useState(INITIAL_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const toast = useToast();

  function handleChange(patch: Partial<SettingsState>) {
    setState((current) => ({ ...current, ...patch }));
    setIsDirty(true);
  }

  function handleSave() {
    setIsDirty(false);
    toast.show({ label: t.toastSaved, tone: 'success' });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[15.625rem_minmax(0,1fr)]">
        <SettingsNav active={section} onSelect={setSection} navLabel={pageLabel} t={t} />

        <div className="flex flex-col gap-4">
          <SettingsSectionBody
            section={section}
            state={state}
            onChange={handleChange}
            people={people}
            tenantAddress={tenantAddress}
            isDirty={isDirty}
            onSave={handleSave}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
