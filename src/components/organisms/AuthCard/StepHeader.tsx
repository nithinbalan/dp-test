/**
 * Internal to AuthCard — not part of the design system's public surface, so it
 * skips the 5-file component discipline (see docs/DESIGN_SYSTEM.md §2, and the
 * scanner in tooling/scripts/lib/extract.mjs, which only looks for
 * `AuthCard.tsx`/`AuthCard.types.ts` in this folder).
 *
 * Back button + title + optional description, repeated at the top of every
 * recovery-flow step.
 */
import { ArrowLeft } from 'lucide-react';
import { Heading } from '@atoms/Heading';
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';

export function StepHeader({
  title,
  description,
  backLabel,
  onBack,
}: {
  title: string;
  description?: string | undefined;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <IconButton label={backLabel} variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4" />
      </IconButton>
      <div className="flex flex-col gap-1">
        <Heading level={2} size="lg">
          {title}
        </Heading>
        {description !== undefined && (
          <Text size="sm" tone="muted">
            {description}
          </Text>
        )}
      </div>
    </div>
  );
}
