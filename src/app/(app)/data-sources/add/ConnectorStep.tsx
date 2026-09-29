'use client';

/**
 * Step 1 — pick a connector, from roughly ninety of them.
 *
 * Two levels rather than one long grid: category first (what kind of thing is
 * it), then the connectors inside it, grouped by what the business uses them
 * for. Search short-circuits both levels and runs across the whole catalogue,
 * because someone who types "razorpay" while standing in Databases means the
 * app, and a search scoped to the current level would tell them it does not
 * exist.
 */
import { useState } from 'react';
import { ArrowLeft, Cloud, Database, FolderOpen, LayoutGrid } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Button } from '@atoms/Button';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { SearchInput } from '@molecules/SearchInput';
import { cn } from '@shared/lib';
import {
  CONNECTOR_CATEGORY_ORDER,
  CONNECTOR_GROUP_ORDER,
  CONNECTORS,
  getConnectorsInCategory,
  searchConnectors,
  type Connector,
  type ConnectorCategory,
} from '@shared/mock/connectors';
import { formatMessage } from '../format-message';
import type { AddSourceMessages } from './AddSourceWizard.types';

const CATEGORY_ICONS: Record<ConnectorCategory, typeof LayoutGrid> = {
  app: LayoutGrid,
  cloud: Cloud,
  db: Database,
  file: FolderOpen,
};

function ConnectorCard({
  connector,
  isSelected,
  onSelect,
}: {
  connector: Connector;
  isSelected: boolean;
  onSelect: () => void;
}) {
  /*
   * .cn-card: bg:#fff, border:1.5px solid var(--line), border-radius:12px,
   * padding:15px 14px, cursor:pointer, text-align:left,
   * transition: border-color .15s, transform .15s
   * hover: border-color:green, transform:translateY(-2px)
   * selected: border-color:green, bg:green-soft
   */
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'border-border-default bg-bg-surface rounded-control hover:border-brand-fg flex w-full cursor-pointer flex-col items-start gap-2 border p-3.5 text-start transition duration-150 hover:-translate-y-0.5',
        isSelected && 'border-brand-fg bg-brand-subtle',
      )}
    >
      {/* .cn-card .ar-logo: 32x32, 8px radius */}
      <Avatar
        label={connector.name}
        initials={connector.mark}
        shape="rounded"
        size="md"
        tone={connector.id === 'tally' ? 'info' : 'brand'}
      />
      <div className="min-w-0">
        <Text as="span" size="sm" weight="semibold" isTruncated className="block">
          {connector.name}
        </Text>
        <Text as="span" size="xs" tone="muted" className="block">
          {connector.description}
        </Text>
      </div>
    </button>
  );
}

function ConnectorGrid({
  connectors,
  selectedId,
  onSelect,
}: {
  connectors: readonly Connector[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  /*
   * .cn-grid: 4-col grid, 12px gap
   * @media <=900px: 2-col
   */
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {connectors.map((connector) => (
        <ConnectorCard
          key={connector.id}
          connector={connector}
          isSelected={selectedId === connector.id}
          onSelect={() => {
            onSelect(connector.id);
          }}
        />
      ))}
    </div>
  );
}

function CategoryCards({
  t,
  onPick,
}: {
  t: AddSourceMessages;
  onPick: (category: ConnectorCategory) => void;
}) {
  /*
   * .cn-cats (prototype calls it cn-cats, 4-col at wide, 2-col at medium):
   * Each category card: bg:#fff, 1.5px border, 12px radius, p:15px 14px
   * icon: 22px, green color, display:block, mb:8px
   * b: 13.5px, display:block
   * small: 11px, ink-soft, line-height:1.4, display:block, mt:2px
   * connector count: xs, brand color, mt:4px
   */
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CONNECTOR_CATEGORY_ORDER.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        const count = getConnectorsInCategory(category).length;
        return (
          <button
            key={category}
            type="button"
            className="border-border-default bg-bg-surface hover:border-brand-fg rounded-control flex w-full cursor-pointer border p-3.5 text-start transition duration-150 hover:-translate-y-0.5"
            onClick={() => {
              onPick(category);
            }}
          >
            <div className="flex gap-3">
              {/* Prototype icon tile: 38px with a softly rounded green background. */}
              <span className="bg-brand-subtle text-brand-fg flex size-10 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <Text as="span" weight="medium" className="block">
                  {t.categoryNames[category]}
                </Text>
                <Text as="span" size="xs" tone="muted" className="block">
                  {t.categoryDescriptions[category]}
                </Text>
                <Text as="span" size="xs" tone="brand" isMono className="mt-1 block">
                  {formatMessage(t.connectorCount, { count })} →
                </Text>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function GroupHeading({ children }: { children: string }) {
  /*
   * .cn-grp: mono, 10.5px, letter-spacing:.07em, uppercase, ink-soft
   * ::after: flex:1 line, 1px height, var(--line) bg
   */
  return (
    <div className="text-fg-subtle text-2xs flex items-center gap-2.5 font-mono tracking-wider uppercase">
      <span>{children}</span>
      <span className="bg-border-default h-px flex-1" aria-hidden />
    </div>
  );
}

function CategoryConnectors({
  t,
  category,
  selectedId,
  onSelect,
  onBack,
}: {
  t: AddSourceMessages;
  category: ConnectorCategory;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const connectors = getConnectorsInCategory(category);
  const isGrouped = connectors.some((connector) => connector.group !== undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          startSlot={<ArrowLeft className="size-4 rtl:-scale-x-100" />}
        >
          {t.allCategories}
        </Button>
        <div>
          <Text as="span" weight="medium" className="block">
            {t.categoryNames[category]}
          </Text>
          <Text as="span" size="xs" tone="muted" className="block">
            {formatMessage(t.connectorCount, { count: connectors.length })}
          </Text>
        </div>
      </div>
      {isGrouped ? (
        CONNECTOR_GROUP_ORDER.map((group) => {
          const inGroup = connectors.filter((connector) => connector.group === group);
          if (inGroup.length === 0) return null;
          return (
            <div key={group} className="flex flex-col gap-2">
              <GroupHeading>{t.groupNames[group] ?? group}</GroupHeading>
              <ConnectorGrid connectors={inGroup} selectedId={selectedId} onSelect={onSelect} />
            </div>
          );
        })
      ) : (
        <ConnectorGrid connectors={connectors} selectedId={selectedId} onSelect={onSelect} />
      )}
    </div>
  );
}

export function ConnectorStep({
  t,
  selectedId,
  onSelect,
}: {
  t: AddSourceMessages;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ConnectorCategory | undefined>(undefined);
  const trimmed = query.trim();
  const matches = searchConnectors(trimmed);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Heading level={2} size="lg">
          {t.chooseTitle}
        </Heading>
        <Text size="sm" tone="muted">
          {t.chooseDescription}
        </Text>
      </div>
      <SearchInput
        value={query}
        onValueChange={setQuery}
        messages={{
          label: t.searchConnectors,
          placeholder: formatMessage(t.searchConnectors, { count: CONNECTORS.length }),
        }}
      />
      {trimmed.length > 0 ? (
        matches.length === 0 ? (
          <EmptyState
            label={t.noMatchTitle}
            description={t.noMatchDescription}
            variant="ghost"
            tone="neutral"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <GroupHeading>
              {matches.length === 1
                ? t.oneMatch
                : formatMessage(t.matchCount, { count: matches.length })}
            </GroupHeading>
            <ConnectorGrid connectors={matches} selectedId={selectedId} onSelect={onSelect} />
          </div>
        )
      ) : category === undefined ? (
        <CategoryCards t={t} onPick={setCategory} />
      ) : (
        <CategoryConnectors
          t={t}
          category={category}
          selectedId={selectedId}
          onSelect={onSelect}
          onBack={() => {
            setCategory(undefined);
          }}
        />
      )}
    </div>
  );
}
