import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { ACTION_ITEMS } from '@shared/mock/grc';
import { getPerson } from '@shared/mock/people';
import { ActionsList } from './ActionsList';
import { resolveActionsMessages } from './ActionsMessages';

export default async function ActionsPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'actions');

  const actions = ACTION_ITEMS.map((action) => ({
    ...action,
    ownerName: getPerson(action.ownerId)?.name ?? '—',
  }));

  return (
    <ActionsList
      actions={actions}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      t={resolveActionsMessages(t)}
    />
  );
}
