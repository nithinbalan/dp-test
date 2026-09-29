import { EmptyState } from '@molecules/EmptyState';
import type { SettingsMessages } from './SettingsMessages';

/** Placeholder body for a nav section that has no panel built yet in this preview. */
export function SettingsComingSoon({ t }: { t: SettingsMessages }) {
  return (
    <EmptyState label={t.comingSoonTitle} description={t.comingSoonDescription} variant="outline" />
  );
}
