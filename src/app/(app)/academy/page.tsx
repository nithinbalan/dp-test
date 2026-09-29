import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { COURSES, courseCompletion } from '@shared/mock/academy';
import { DEVICES } from '@shared/mock/devices';
import { AcademyList } from './AcademyList';
import type { AcademyMessages } from './AcademyMessages';

export default async function AcademyPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'academy');

  const courses = COURSES.map((course) => ({ ...course, ...courseCompletion(course) }));
  const avgCompletion = Math.round(
    courses.reduce((sum, course) => sum + course.percent, 0) / courses.length,
  );
  const overdueCount = DEVICES.filter((device) => device.awarenessStatus === 'overdue').length;
  const requiredCount = COURSES.filter((course) => course.isRequired).length;

  const messages: AcademyMessages = {
    kpiCourses: t('kpiCourses'),
    kpiAvgCompletion: t('kpiAvgCompletion'),
    kpiOverdue: t('kpiOverdue'),
    kpiRequired: t('kpiRequired'),
    tableCaption: t('tableCaption'),
    tableCourse: t('tableCourse'),
    tableAudience: t('tableAudience'),
    tableDuration: t('tableDuration'),
    tableRequired: t('tableRequired'),
    tableCompletion: t('tableCompletion'),
    tableActions: t('tableActions'),
    requiredYes: t('requiredYes'),
    requiredNo: t('requiredNo'),
    durationLabel: t('durationLabel'),
    reminderLabel: t('reminderLabel'),
    toastReminderSent: t('toastReminderSent'),
    campaignCta: t('campaignCta'),
    toastCampaignSent: t('toastCampaignSent'),
  };

  return (
    <AcademyList
      courses={courses}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      avgCompletion={avgCompletion}
      overdueCount={overdueCount}
      requiredCount={requiredCount}
      t={messages}
    />
  );
}
