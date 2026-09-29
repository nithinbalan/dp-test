import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { NoticeEditor } from './NoticeEditor';
import { buildNoticeEditorMessages } from './notice-editor-messages-builder';

/**
 * Server component resolves locale/copy only (ADR-0006) — the notice itself is
 * fetched client-side by `NoticeEditor` via `useNotice()`.
 */
export default async function NoticeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'notices');
  const messages = buildNoticeEditorMessages(t);

  return <NoticeEditor id={id} t={messages} />;
}
