import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { buildAddActivityMessages } from '../../add/buildAddActivityMessages';
import { EditActivityWizard } from './EditActivityWizard';

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'ropa');
  const messages = buildAddActivityMessages(t);

  return <EditActivityWizard id={id} t={messages} />;
}
