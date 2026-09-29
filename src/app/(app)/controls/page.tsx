import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { computeControlScore, CONTROLS } from '@shared/mock/controls';
import { ControlsList } from './ControlsList';
import { resolveControlsMessages } from './ControlsMessages';

export default async function ControlsPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'controls');

  const { overall } = computeControlScore();
  const passingCount = CONTROLS.filter((control) => control.status === 'pass').length;
  const failingCount = CONTROLS.filter((control) => control.status === 'fail').length;
  const pendingCount = CONTROLS.filter((control) => control.status === 'pending').length;

  const messages = resolveControlsMessages(t);

  return (
    <ControlsList
      controls={CONTROLS}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      overall={overall}
      passingCount={passingCount}
      failingCount={failingCount}
      pendingCount={pendingCount}
      t={messages}
    />
  );
}
