import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { NoticePreview } from './NoticePreview';
import type { NoticePreviewMessages } from './NoticePreviewMessages';

/** Server component resolves locale/copy only (ADR-0006) — the notice is fetched
 * client-side by `NoticePreview` via `useNotice()`. */
export default async function NoticePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'notices');

  const messages: NoticePreviewMessages = {
    previewTitle: t('previewTitle'),
    previewMeta: t('previewMeta'),
    previewDisclaimer: t('previewDisclaimer'),
    printCta: t('printCta'),
    copyEmbedCta: t('copyEmbedCta'),
    copyEmbedSuccess: t('copyEmbedSuccess'),
    copyEmbedFailed: t('copyEmbedFailed'),
    backToNotice: t('backToNotice'),
    notFoundTitle: t('notFoundTitle'),
    notFoundDescription: t('notFoundDescription'),
    loadErrorTitle: t('loadErrorTitle'),
    loadErrorDescription: t('loadErrorDescription'),
  };

  return <NoticePreview id={id} t={messages} />;
}
