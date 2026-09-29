import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { AiChatView } from './AiChatView';
import type { AiMessages } from './AiMessages';

export default async function AiPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'ai');

  const messages: AiMessages = {
    assistantName: t('assistantName'),
    inputLabel: t('inputLabel'),
    inputPlaceholder: t('inputPlaceholder'),
    sendLabel: t('sendLabel'),
    respondingLabel: t('respondingLabel'),
    welcomeMessage: t('welcomeMessage'),
    suggestion1: t('suggestion1'),
    suggestion2: t('suggestion2'),
    suggestion3: t('suggestion3'),
    suggestion4: t('suggestion4'),
    disclaimer: t('disclaimer'),
  };

  return (
    <AiChatView
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      t={messages}
    />
  );
}
