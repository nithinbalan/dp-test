'use client';

/**
 * The published notice, rendered the way a data principal would read it — matches
 * the prototype's `.nt-view` hosted-page viewer. Stays behind the normal authenticated
 * `AppShell` (an in-app preview, not a real public route — see the plan this module
 * shipped against), so the "Copy embed code" link points at this same in-app URL.
 */
import { useState } from 'react';
import NextLink from 'next/link';
import { ArrowLeft, Check, Copy, Printer } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { ApiError } from '@shared/lib/api-client';
import { formatDate } from '@shared/lib';
import { useNotice, useToast, type NoticeDetail } from '@shared/hooks';
import type { NoticePreviewMessages } from './NoticePreviewMessages';

function PreviewLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      {/* Toolbar skeleton — mirrors PreviewToolbar layout */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      {/* Disclaimer text skeleton */}
      <div>
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      {/* Notice document card skeleton */}
      <Card variant="outline" className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>

        <div className="flex flex-col gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton lines={3} className="w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PreviewToolbar({
  id,
  t,
  copied,
  onCopyEmbed,
}: {
  id: string;
  t: NoticePreviewMessages;
  copied: boolean;
  onCopyEmbed: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <NextLink href={`/notices/${id}`}>
            <ArrowLeft className="me-1.5 inline size-4" />
            {t.backToNotice}
          </NextLink>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            startSlot={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            onClick={onCopyEmbed}
          >
            {t.copyEmbedCta}
          </Button>
          <Button
            variant="outline"
            size="sm"
            startSlot={<Printer className="size-4" />}
            onClick={() => {
              window.print();
            }}
          >
            {t.printCta}
          </Button>
        </div>
      </div>
      <div className="print:hidden">
        <Text as="p" size="xs" tone="muted">
          {t.previewDisclaimer}
        </Text>
      </div>
    </>
  );
}

function NoticeDocument({ t, notice }: { t: NoticePreviewMessages; notice: NoticeDetail }) {
  return (
    <Card
      variant="outline"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 print:border-none print:shadow-none"
    >
      <div className="flex flex-col gap-1">
        <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
          {t.previewTitle}
        </Text>
        <Heading level={1} size="xl">
          {notice.name}
        </Heading>
        <Text as="span" size="xs" tone="muted" isMono>
          {notice.refCode} · {t.previewMeta.replace('{date}', formatDate(notice.updatedAt))}
        </Text>
      </div>

      <div className="flex flex-col gap-5">
        {notice.sections.map((section) => (
          <div key={section.key} className="flex flex-col gap-1.5">
            <Heading level={2} size="sm">
              {section.heading}
            </Heading>
            <Text as="p" size="sm" tone="muted" className="whitespace-pre-line">
              {section.body}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NoticePreview({ id, t }: { id: string; t: NoticePreviewMessages }) {
  const { data, isLoading, isError, error } = useNotice(id);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (isLoading) return <PreviewLoading />;

  if (isError || !data) {
    const isNotFound = error instanceof ApiError && error.code === 'NOT_FOUND';
    return (
      <EmptyState
        label={isNotFound ? t.notFoundTitle : t.loadErrorTitle}
        description={isNotFound ? t.notFoundDescription : t.loadErrorDescription}
        tone="danger"
        actionSlot={
          <Button asChild variant="outline">
            <NextLink href="/notices">{t.backToNotice}</NextLink>
          </Button>
        }
      />
    );
  }

  async function handleCopyEmbed() {
    const url = `${window.location.origin}/notices/${id}/preview`;
    const embed = `<iframe src="${url}" width="100%" height="800" frameborder="0"></iframe>`;
    try {
      await navigator.clipboard.writeText(embed);
      setCopied(true);
      toast.show({ label: t.copyEmbedSuccess, tone: 'success' });
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // The browser can deny clipboard access (e.g. no user-activation context,
      // or a denied permission) — tell the user rather than silently doing nothing.
      toast.show({ label: t.copyEmbedFailed, tone: 'danger' });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PreviewToolbar
        id={id}
        t={t}
        copied={copied}
        onCopyEmbed={() => {
          void handleCopyEmbed();
        }}
      />
      <NoticeDocument t={t} notice={data} />
    </div>
  );
}
