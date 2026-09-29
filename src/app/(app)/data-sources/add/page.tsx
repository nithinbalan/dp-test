import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { buildAddSourceMessages } from './AddSourceMessages';
import { AddSourceWizard } from './AddSourceWizard';

export default async function AddSourcePage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'data-sources');

  return <AddSourceWizard messages={buildAddSourceMessages(t)} />;
}
