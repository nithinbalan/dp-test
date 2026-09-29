'use client';

/** Headline statistics, plus where this source's findings end up downstream. */
import NextLink from 'next/link';
import { Badge } from '@atoms/Badge';
import { Card } from '@atoms/Card';
import { Text } from '@atoms/Text';
import { StatCard } from '@molecules/StatCard';
import type { RiskLevel, SourceStat } from '@shared/mock/source-details';
import type { SourceDetailMessages } from './SourceDetail.types';

/** Only the risk stat is good or bad news; the rest are counts. */
const RISK_TONES: Record<RiskLevel, 'danger' | 'warning' | 'success' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
  unknown: 'neutral',
};

function statValue(stat: SourceStat, t: SourceDetailMessages): string {
  if (stat.risk !== undefined) return t.riskNames[stat.risk];
  return stat.value;
}

export function OverviewPanel({
  stats,
  t,
}: {
  stats: readonly SourceStat[];
  t: SourceDetailMessages;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <StatCard
            key={stat.kind}
            label={t.statNames[stat.kind]}
            value={statValue(stat, t)}
            description={stat.note}
            tone={stat.risk === undefined ? 'neutral' : RISK_TONES[stat.risk]}
            size="sm"
          />
        ))}
      </div>
      <Card variant="outline" size="md" className="flex flex-col gap-2">
        <div>
          <Text as="span" weight="medium" className="block">
            {t.whereFeedsTitle}
          </Text>
          <Text as="span" size="xs" tone="muted" className="block">
            {t.whereFeedsDescription}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NextLink href="/data-map" className="hover:underline">
            <Badge variant="outline" tone="brand">
              {t.feedsDataMap}
            </Badge>
          </NextLink>
          <NextLink href="/ropa" className="hover:underline">
            <Badge variant="outline" tone="brand">
              {t.feedsRopa}
            </Badge>
          </NextLink>
          <Badge variant="outline">{t.feedsDpdp}</Badge>
          <NextLink href="/risks" className="hover:underline">
            <Badge variant="outline" tone="brand">
              {t.feedsRisk}
            </Badge>
          </NextLink>
        </div>
      </Card>
    </div>
  );
}
