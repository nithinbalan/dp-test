import { Card } from '@atoms/Card';
import { Select, type SelectOption } from '@atoms/Select';
import { Switch } from '@atoms/Switch';
import type { SettingsMessages } from './SettingsMessages';
import { SettingsRow } from './SettingsRow';
import type { SettingsState } from './SettingsState';

export function NotificationsPanel({
  state,
  onChange,
  t,
}: {
  state: SettingsState;
  onChange: (patch: Partial<SettingsState>) => void;
  t: SettingsMessages;
}) {
  const digestOptions: SelectOption[] = [
    { value: 'daily', label: t.digestDaily },
    { value: 'weekly', label: t.digestWeekly },
    { value: 'off', label: t.digestOff },
  ];

  return (
    <Card variant="outline" className="flex flex-col gap-4">
      <SettingsRow
        label={t.digestLabel}
        control={
          <Select
            options={digestOptions}
            value={state.digestFrequency}
            onValueChange={(digestFrequency) => {
              onChange({ digestFrequency });
            }}
            aria-label={t.digestLabel}
          />
        }
      />

      <SettingsRow
        label={t.emailLabel}
        description={t.emailDescription}
        control={
          <Switch
            isSelected={state.emailNotifications}
            onValueChange={(emailNotifications) => {
              onChange({ emailNotifications });
            }}
            aria-label={t.emailLabel}
          />
        }
      />

      <SettingsRow
        label={t.whatsappLabel}
        description={t.whatsappDescription}
        control={
          <Switch
            isSelected={state.whatsappNudges}
            onValueChange={(whatsappNudges) => {
              onChange({ whatsappNudges });
            }}
            aria-label={t.whatsappLabel}
          />
        }
      />

      <SettingsRow
        label={t.escalateLabel}
        description={t.escalateDescription}
        control={
          <Switch
            isSelected={state.escalateOverdue}
            onValueChange={(escalateOverdue) => {
              onChange({ escalateOverdue });
            }}
            aria-label={t.escalateLabel}
          />
        }
      />
    </Card>
  );
}
