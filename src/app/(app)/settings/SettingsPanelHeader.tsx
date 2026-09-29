import type { ReactNode } from 'react';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';

/** Icon disc + "Name — headline" + description, above every Configuration Studio panel. */
export function SettingsPanelHeader({
  icon,
  name,
  headline,
  description,
}: {
  icon: ReactNode;
  name: string;
  headline: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="bg-brand-subtle text-brand-fg grid size-11 shrink-0 place-items-center rounded-xl"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <Heading level={2} size="md">
          {name} — {headline}
        </Heading>
        <Text size="sm" tone="muted" className="max-w-2xl">
          {description}
        </Text>
      </div>
    </div>
  );
}
