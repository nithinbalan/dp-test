import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { buildDataSourcesMessages } from './DataSourcesMessages';
import { SourceRegister } from './SourceRegister';

/**
 * Resolves copy on the server and hands it down. The register itself reads from
 * the mock store on the client — see `SourceRegister` for why.
 */
export default async function DataSourcesPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'data-sources');

  return <SourceRegister messages={buildDataSourcesMessages(t)} />;
}
