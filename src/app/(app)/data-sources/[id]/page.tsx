import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { SourceDetail } from './SourceDetail';
import { buildSourceDetailMessages } from './SourceDetailMessages';

/**
 * Resolves copy and hands the id down. The source itself is looked up on the
 * client: the register is client state, so a source connected through the wizard
 * exists there and not in the server's seed — calling `notFound()` here would
 * 404 a source the user just created.
 */
export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'data-sources');

  return <SourceDetail sourceId={id} messages={buildSourceDetailMessages(t)} />;
}
