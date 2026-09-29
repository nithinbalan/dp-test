import type { ReactNode } from 'react';
import { Text } from '@atoms/Text';

/** Label + description on the start side, a control on the end side. */
export function SettingsRow({
  label,
  badge,
  description,
  control,
  note,
}: {
  label: ReactNode;
  /** Inline marker beside the label — e.g. a `Badge` for a field the Act locks. */
  badge?: ReactNode | undefined;
  description?: string | undefined;
  control: ReactNode;
  note?: string | undefined;
}) {
  return (
    <div className="border-border-default flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium">
            {label}
          </Text>
          {badge}
        </div>
        {description !== undefined && (
          <Text size="xs" tone="muted">
            {description}
          </Text>
        )}
        {note !== undefined && (
          <Text size="2xs" tone="muted" className="italic">
            {note}
          </Text>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
