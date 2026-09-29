import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { AddActivityWizard } from './AddActivityWizard';
import { buildAddActivityMessages } from './buildAddActivityMessages';

export default async function AddActivityPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'ropa');
  const messages = buildAddActivityMessages(t);

  return <AddActivityWizard t={messages} />;
}
