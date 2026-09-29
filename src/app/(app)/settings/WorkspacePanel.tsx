import { Badge } from '@atoms/Badge';
import { Card } from '@atoms/Card';
import { Input } from '@atoms/Input';
import { Select, type SelectOption } from '@atoms/Select';
import { Switch } from '@atoms/Switch';
import { PeoplePicker, type PersonOption } from '@molecules/PeoplePicker';
import { TagPicker, type TagPickerOption } from '@molecules/TagPicker';
import type { SettingsMessages } from './SettingsMessages';
import { SettingsRow } from './SettingsRow';
import { WorkspaceLogoField } from './WorkspaceLogoField';

/** The fields this panel edits. Backed by `/api/settings` — see WorkspaceSettingsPanel.tsx. */
export type WorkspacePanelState = {
  workspaceLogoUrl: string | undefined;
  legalEntityName: string;
  sector: string;
  languages: string[];
  dpoId: string | undefined;
  publishDpo: boolean;
};

/** Props specific to the logo row's upload behaviour — passed through from the panel. */
export type WorkspaceLogoUploadProps = {
  isUploadingLogo: boolean;
  onLogoFileSelected: (file: File) => void;
};

function LockedBadge({ label }: { label: string }) {
  return (
    <Badge variant="soft" size="xs" tone="neutral">
      {label}
    </Badge>
  );
}

function IdentityRows({
  state,
  onChange,
  tenantAddress,
  t,
  isUploadingLogo,
  onLogoFileSelected,
}: {
  state: WorkspacePanelState;
  onChange: (patch: Partial<WorkspacePanelState>) => void;
  tenantAddress: string;
  t: SettingsMessages;
} & WorkspaceLogoUploadProps) {
  const sectorOptions: SelectOption[] = [
    { value: 'saas', label: t.sectorSaas },
    { value: 'ecommerce', label: t.sectorEcommerce },
    { value: 'healthcare', label: t.sectorHealthcare },
    { value: 'edtech', label: t.sectorEdtech },
    { value: 'bfsi', label: t.sectorBfsi },
    { value: 'manufacturing', label: t.sectorManufacturing },
    { value: 'professional', label: t.sectorProfessional },
  ];

  return (
    <>
      <SettingsRow
        label={t.workspaceLogoLabel}
        description={t.workspaceLogoDescription}
        control={
          <WorkspaceLogoField
            workspaceName={state.legalEntityName}
            logoUrl={state.workspaceLogoUrl}
            uploadLabel={t.workspaceLogoUpload}
            replaceLabel={t.workspaceLogoReplace}
            isUploading={isUploadingLogo}
            onLogoPreview={(workspaceLogoUrl) => {
              onChange({ workspaceLogoUrl });
            }}
            onFileSelected={onLogoFileSelected}
          />
        }
      />

      <SettingsRow
        label={t.legalNameLabel}
        description={t.legalNameDescription}
        control={
          <Input
            value={state.legalEntityName}
            onChange={(event) => {
              onChange({ legalEntityName: event.target.value });
            }}
            aria-label={t.legalNameLabel}
          />
        }
      />

      <SettingsRow
        label={t.tenantLabel}
        badge={<LockedBadge label={t.lockedBadge} />}
        description={t.tenantDescription}
        control={<Input value={tenantAddress} isDisabled aria-label={t.tenantLabel} readOnly />}
      />

      <SettingsRow
        label={t.sectorLabel}
        description={t.sectorDescription}
        control={
          <Select
            options={sectorOptions}
            value={state.sector}
            onValueChange={(sector) => {
              onChange({ sector });
            }}
            aria-label={t.sectorLabel}
          />
        }
      />
    </>
  );
}

function languageOptions(t: SettingsMessages): TagPickerOption[] {
  return [
    { value: 'en', label: t.languageEnglish, isLocked: true },
    { value: 'hi', label: t.languageHindiNative, caption: t.languageHindi },
    { value: 'ml', label: t.languageMalayalamNative, caption: t.languageMalayalam },
    { value: 'ta', label: t.languageTamilNative, caption: t.languageTamil },
    { value: 'bn', label: t.languageBengaliNative, caption: t.languageBengali },
    { value: 'mr', label: t.languageMarathiNative, caption: t.languageMarathi },
    { value: 'te', label: t.languageTeluguNative, caption: t.languageTelugu },
    { value: 'gu', label: t.languageGujaratiNative, caption: t.languageGujarati },
    { value: 'kn', label: t.languageKannadaNative, caption: t.languageKannada },
  ];
}

function DpoRows({
  state,
  onChange,
  people,
  t,
}: {
  state: WorkspacePanelState;
  onChange: (patch: Partial<WorkspacePanelState>) => void;
  people: readonly PersonOption[];
  t: SettingsMessages;
}) {
  return (
    <>
      <SettingsRow
        label={t.languagesLabel}
        description={t.languagesDescription}
        control={
          <TagPicker
            label={t.languagesLabel}
            isLabelVisible={false}
            options={languageOptions(t)}
            value={state.languages}
            onValueChange={(languages) => {
              onChange({ languages });
            }}
            className="w-full max-w-sm"
          />
        }
      />

      <SettingsRow
        label={t.dpoLabel}
        description={t.dpoDescription}
        control={
          <PeoplePicker
            label={t.dpoLabel}
            isLabelVisible={false}
            people={people}
            value={state.dpoId}
            onValueChange={(dpoId) => {
              onChange({ dpoId });
            }}
            variant="trigger"
            employeeRegisterHref="/employees"
            messages={{
              searchPlaceholder: t.dpoSearchPlaceholder,
              escHint: t.dpoEscHint,
              footerLabel: t.dpoFooterLabel,
              manageLabel: t.dpoManageLabel,
            }}
            className="w-full max-w-sm"
          />
        }
      />

      <SettingsRow
        label={t.publishDpoLabel}
        badge={<LockedBadge label={t.lockedBadge} />}
        description={t.publishDpoDescription}
        control={<Switch isSelected={state.publishDpo} isDisabled aria-label={t.publishDpoLabel} />}
      />
    </>
  );
}

export function WorkspacePanel({
  state,
  onChange,
  people,
  tenantAddress,
  t,
  isUploadingLogo,
  onLogoFileSelected,
}: {
  state: WorkspacePanelState;
  onChange: (patch: Partial<WorkspacePanelState>) => void;
  people: readonly PersonOption[];
  tenantAddress: string;
  t: SettingsMessages;
} & WorkspaceLogoUploadProps) {
  return (
    <Card variant="outline" className="flex flex-col gap-4">
      <IdentityRows
        state={state}
        onChange={onChange}
        tenantAddress={tenantAddress}
        t={t}
        isUploadingLogo={isUploadingLogo}
        onLogoFileSelected={onLogoFileSelected}
      />
      <DpoRows state={state} onChange={onChange} people={people} t={t} />
    </Card>
  );
}
