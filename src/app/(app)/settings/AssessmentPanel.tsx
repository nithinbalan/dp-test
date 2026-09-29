import { Card } from '@atoms/Card';
import { Select, type SelectOption } from '@atoms/Select';
import { Switch } from '@atoms/Switch';
import { Text } from '@atoms/Text';
import { PeoplePicker, type PersonOption } from '@molecules/PeoplePicker';
import type { SettingsMessages } from './SettingsMessages';
import { SettingsRow } from './SettingsRow';
import type { SettingsState } from './SettingsState';

function LockedRows({ state, t }: { state: SettingsState; t: SettingsMessages }) {
  return (
    <>
      <SettingsRow
        label={t.childrenDpiaLabel}
        description={t.childrenDpiaDescription}
        note={t.lockedNote}
        control={
          <Switch
            isSelected={state.childrenAlwaysDpia}
            isDisabled
            aria-label={t.childrenDpiaLabel}
          />
        }
      />

      <SettingsRow
        label={t.dpoSignOffLabel}
        description={t.dpoSignOffDescription}
        note={t.lockedNote}
        control={
          <Switch isSelected={state.dpoSignOffRequired} isDisabled aria-label={t.dpoSignOffLabel} />
        }
      />

      <SettingsRow
        label={t.boardWindowLabel}
        description={t.boardWindowDescription}
        note={t.lockedNote}
        control={
          <Text size="sm" weight="medium" isMono>
            {t.boardWindowValue}
          </Text>
        }
      />
    </>
  );
}

export function AssessmentPanel({
  state,
  onChange,
  people,
  t,
}: {
  state: SettingsState;
  onChange: (patch: Partial<SettingsState>) => void;
  people: readonly PersonOption[];
  t: SettingsMessages;
}) {
  const cadenceOptions: SelectOption[] = [
    { value: 'monthly', label: t.cadenceMonthly },
    { value: 'quarterly', label: t.cadenceQuarterly },
    { value: 'half-yearly', label: t.cadenceHalfYearly },
  ];

  return (
    <Card variant="outline" className="flex flex-col gap-4">
      <SettingsRow
        label={t.cadenceLabel}
        control={
          <Select
            options={cadenceOptions}
            value={state.reassessmentCadence}
            onValueChange={(reassessmentCadence) => {
              onChange({ reassessmentCadence });
            }}
            aria-label={t.cadenceLabel}
          />
        }
      />

      <PeoplePicker
        label={t.assessorLabel}
        people={people}
        value={state.defaultAssessorId}
        onValueChange={(defaultAssessorId) => {
          onChange({ defaultAssessorId });
        }}
      />

      <SettingsRow
        label={t.pushGapsLabel}
        description={t.pushGapsDescription}
        control={
          <Switch
            isSelected={state.pushGapsToIssues}
            onValueChange={(pushGapsToIssues) => {
              onChange({ pushGapsToIssues });
            }}
            aria-label={t.pushGapsLabel}
          />
        }
      />

      <LockedRows state={state} t={t} />
    </Card>
  );
}
