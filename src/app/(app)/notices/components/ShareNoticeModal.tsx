'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Eye, FileText } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { Dialog } from '@organisms/Dialog';
import { useToast, type NoticeDetail } from '@shared/hooks';
export type ShareNoticeMessages = {
  shareModalTitle: string;
  shareModalSub: string;
  sharePublicUrlTitle: string;
  sharePublicUrlSub: string;
  sharePublicUrlHint: string;
  shareEmbedTitle: string;
  shareEmbedSub: string;
  shareOfflineTitle: string;
  shareOfflineSub: string;
  shareCopyUrl: string;
  shareOpenUrl: string;
  shareCopyEmbed: string;
  sharePreview: string;
  shareDownloadPdf: string;
  toastCopiedUrl: string;
  toastCopiedEmbed: string;
  copyEmbedFailed: string;
};

function PublicUrlPanel({
  t,
  publicUrl,
  copied,
  onCopy,
  onOpen,
}: {
  t: ShareNoticeMessages;
  publicUrl: string;
  copied: boolean;
  onCopy: () => void;
  onOpen: () => void;
}) {
  return (
    <Card variant="outline" className="flex flex-col gap-2 p-4">
      <div>
        <Text weight="bold" size="sm">
          {t.sharePublicUrlTitle}
        </Text>
        <Text size="xs" tone="muted">
          {t.sharePublicUrlSub}
        </Text>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <code className="bg-bg-canvas border-border-default text-brand-fg rounded-control flex-1 overflow-x-auto border px-3 py-2 font-mono text-xs whitespace-nowrap">
          {publicUrl}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          startSlot={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        >
          {t.shareCopyUrl}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpen}
          startSlot={<ExternalLink className="size-4" />}
        >
          {t.shareOpenUrl}
        </Button>
      </div>
      <Text size="xs" tone="muted" className="pt-1">
        {t.sharePublicUrlHint}
      </Text>
    </Card>
  );
}

function EmbedPanel({
  t,
  embedCode,
  copied,
  onCopy,
  onPreview,
}: {
  t: ShareNoticeMessages;
  embedCode: string;
  copied: boolean;
  onCopy: () => void;
  onPreview: () => void;
}) {
  return (
    <Card variant="outline" className="flex flex-col gap-2 p-4">
      <div>
        <Text weight="bold" size="sm">
          {t.shareEmbedTitle}
        </Text>
        <Text size="xs" tone="muted">
          {t.shareEmbedSub}
        </Text>
      </div>
      <pre className="bg-bg-inverse text-fg-inverse rounded-control overflow-x-auto p-3 font-mono text-xs leading-relaxed whitespace-pre">
        {embedCode}
      </pre>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          startSlot={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        >
          {t.shareCopyEmbed}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          startSlot={<Eye className="size-4" />}
        >
          {t.sharePreview}
        </Button>
      </div>
    </Card>
  );
}

function OfflinePanel({ t, onDownload }: { t: ShareNoticeMessages; onDownload: () => void }) {
  return (
    <Card variant="outline" className="flex items-center justify-between gap-4 p-4">
      <div>
        <Text weight="bold" size="sm">
          {t.shareOfflineTitle}
        </Text>
        <Text size="xs" tone="muted">
          {t.shareOfflineSub}
        </Text>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        startSlot={<FileText className="size-4" />}
      >
        {t.shareDownloadPdf}
      </Button>
    </Card>
  );
}

function useShareNoticeState(notice: NoticeDetail, t: ShareNoticeMessages) {
  const toast = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://privacy.jethur.ai';
  const publicUrl = `${origin}/notices/${notice.id}/preview`;
  const embedCode = `<iframe\n  src="${publicUrl}"\n  width="100%"\n  height="800"\n  frameborder="0">\n</iframe>`;
  const languageCount = notice.langs?.length ?? 1;
  const subText = t.shareModalSub
    .replace('{version}', notice.version)
    .replace('{count}', String(languageCount))
    .replace('{plural}', languageCount > 1 ? 's' : '');

  async function copyToClipboard(
    text: string,
    onCopied: (v: boolean) => void,
    successLabel: string,
  ) {
    try {
      await navigator.clipboard.writeText(text);
      onCopied(true);
      toast.show({ label: successLabel, tone: 'success' });
      window.setTimeout(() => {
        onCopied(false);
      }, 2000);
    } catch {
      toast.show({ label: t.copyEmbedFailed, tone: 'danger' });
    }
  }

  return {
    publicUrl,
    embedCode,
    subText,
    copiedUrl,
    copiedEmbed,
    handleCopyUrl: () => {
      void copyToClipboard(publicUrl, setCopiedUrl, t.toastCopiedUrl);
    },
    handleCopyEmbed: () => {
      void copyToClipboard(embedCode, setCopiedEmbed, t.toastCopiedEmbed);
    },
  };
}

export function ShareNoticeModal({
  isOpen,
  onClose,
  notice,
  t,
  onOpenPreview,
  onPrintPdf,
}: {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeDetail | null;
  t: ShareNoticeMessages;
  onOpenPreview?: (notice: NoticeDetail) => void;
  onPrintPdf?: () => void;
}) {
  if (!notice) return null;
  return (
    <ShareNoticeModalContent
      isOpen={isOpen}
      onClose={onClose}
      notice={notice}
      t={t}
      onOpenPreview={onOpenPreview}
      onPrintPdf={onPrintPdf}
    />
  );
}

function ShareNoticeModalContent({
  isOpen,
  onClose,
  notice,
  t,
  onOpenPreview,
  onPrintPdf,
}: {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeDetail;
  t: ShareNoticeMessages;
  onOpenPreview?: ((notice: NoticeDetail) => void) | undefined;
  onPrintPdf?: (() => void) | undefined;
}) {
  const { publicUrl, embedCode, subText, copiedUrl, copiedEmbed, handleCopyUrl, handleCopyEmbed } =
    useShareNoticeState(notice, t);

  function openPreview() {
    if (onOpenPreview) onOpenPreview(notice);
    else window.open(publicUrl, '_blank');
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      label={t.shareModalTitle}
      description={subText}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-brand-solid text-fg-inverse rounded-pill grid size-10 shrink-0 place-items-center">
            <Check className="size-5" />
          </span>
          <div>
            <Heading level={2} size="md">
              {t.shareModalTitle}
            </Heading>
            <Text size="xs" tone="muted">
              {subText}
            </Text>
          </div>
        </div>

        <PublicUrlPanel
          t={t}
          publicUrl={publicUrl}
          copied={copiedUrl}
          onCopy={handleCopyUrl}
          onOpen={openPreview}
        />
        <EmbedPanel
          t={t}
          embedCode={embedCode}
          copied={copiedEmbed}
          onCopy={handleCopyEmbed}
          onPreview={openPreview}
        />
        <OfflinePanel
          t={t}
          onDownload={() => {
            if (onPrintPdf) onPrintPdf();
            else window.open(publicUrl, '_blank');
          }}
        />
      </div>
    </Dialog>
  );
}
