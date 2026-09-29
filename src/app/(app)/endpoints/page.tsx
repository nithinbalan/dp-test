import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { DEVICES } from '@shared/mock/devices';
import { PEOPLE } from '@shared/mock/people';
import { EndpointsList } from './EndpointsList';
import type { EndpointsMessages } from './EndpointsMessages';

export default async function EndpointsPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'endpoints');

  const endpoints = DEVICES.map((device) => {
    const person = PEOPLE.find((p) => p.id === device.personId);
    return {
      personId: device.personId,
      name: person?.name ?? '—',
      department: person?.department ?? '—',
      deviceId: device.deviceId,
      os: device.os,
      agentStatus: device.agentStatus,
      agentVersion: device.agentVersion,
      hasPii: device.hasPii,
      piiFindings: device.piiFindings,
      lastScanAt: device.lastScanAt,
      lastScanLocation: device.lastScanLocation,
    };
  });

  const activeCount = DEVICES.filter((d) => d.agentStatus === 'active').length;
  const findingsCount = DEVICES.filter((d) => d.hasPii).length;
  const pendingCount = DEVICES.filter((d) => d.agentStatus !== 'active').length;

  const messages: EndpointsMessages = {
    kpiDevices: t('kpiDevices'),
    kpiAgentsActive: t('kpiAgentsActive'),
    kpiAgentsActiveDescription: t('kpiAgentsActiveDescription'),
    kpiWithFindings: t('kpiWithFindings'),
    kpiPending: t('kpiPending'),
    searchPlaceholder: t('searchPlaceholder'),
    filterAll: t('filterAll'),
    filterActive: t('filterActive'),
    filterPending: t('filterPending'),
    filterFindings: t('filterFindings'),
    sendLinksCta: t('sendLinksCta'),
    tableCaption: t('tableCaption'),
    tableEmployee: t('tableEmployee'),
    tableDevice: t('tableDevice'),
    tableOs: t('tableOs'),
    tableAgent: t('tableAgent'),
    tableFindings: t('tableFindings'),
    tableLastScan: t('tableLastScan'),
    tableActions: t('tableActions'),
    noFindings: t('noFindings'),
    piiFound: t('piiFound'),
    agentActive: t('agentActive'),
    agentOutdated: t('agentOutdated'),
    agentNotInstalled: t('agentNotInstalled'),
    scanLabel: t('scanLabel'),
    pushUpdateLabel: t('pushUpdateLabel'),
    sendInstallLabel: t('sendInstallLabel'),
    toastScanStarted: t('toastScanStarted'),
    toastUpdatePushed: t('toastUpdatePushed'),
    toastInstallSent: t('toastInstallSent'),
    toastBulkInstallSent: t('toastBulkInstallSent'),
    paginationSummary: t('paginationSummary'),
    pageSizeLabel: t('pageSizeLabel'),
  };

  return (
    <EndpointsList
      endpoints={endpoints}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      activeCount={activeCount}
      findingsCount={findingsCount}
      pendingCount={pendingCount}
      t={messages}
    />
  );
}
