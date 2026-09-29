import { Card } from '@atoms/Card';
import { Input } from '@atoms/Input';
import { Select, type SelectOption } from '@atoms/Select';
import { Switch } from '@atoms/Switch';
import type { SettingsMessages } from './SettingsMessages';
import { SettingsRow } from './SettingsRow';
import type { SettingsState } from './SettingsState';

export function AwarenessPanel({
  state,
  onChange,
  t,
}: {
  state: SettingsState;
  onChange: (patch: Partial<SettingsState>) => void;
  t: SettingsMessages;
}) {
  const reminderOptions: SelectOption[] = [
    { value: 'weekly', label: t.reminderWeekly },
    { value: 'fortnightly', label: t.reminderFortnightly },
  ];

  return (
    <Card variant="outline" className="flex flex-col gap-4">
      <SettingsRow
        label={t.autoEnrolLabel}
        description={t.autoEnrolDescription}
        control={
          <Switch
            isSelected={state.autoEnrolNewJoiners}
            onValueChange={(autoEnrolNewJoiners) => {
              onChange({ autoEnrolNewJoiners });
            }}
            aria-label={t.autoEnrolLabel}
          />
        }
      />

      <SettingsRow
        label={t.reminderCadenceLabel}
        control={
          <Select
            options={reminderOptions}
            value={state.awarenessReminderCadence}
            onValueChange={(awarenessReminderCadence) => {
              onChange({ awarenessReminderCadence });
            }}
            aria-label={t.reminderCadenceLabel}
          />
        }
      />

      <SettingsRow
        label={t.recertLabel}
        description={t.recertDescription}
        control={
          <Input
            type="number"
            value={String(state.recertificationMonths)}
            onChange={(event) => {
              onChange({ recertificationMonths: Number(event.target.value) || 0 });
            }}
            aria-label={t.recertLabel}
            className="w-20"
          />
        }
      />
    </Card>
  );
}
