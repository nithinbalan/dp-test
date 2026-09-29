import type {
  ControlDomainKey,
  AutomationLevel,
  ControlStatus,
  ControlType,
} from '@shared/mock/controls';
import type { ControlsMessages } from './ControlsMessages';

export function domainLabel(t: ControlsMessages, domain: ControlDomainKey): string {
  const labels: Record<ControlDomainKey, string> = {
    'lawful-basis': t.domainLawfulBasis,
    notice: t.domainNotice,
    consent: t.domainConsent,
    children: t.domainChildren,
    rights: t.domainRights,
    retention: t.domainRetention,
    security: t.domainSecurity,
    breach: t.domainBreach,
    processors: t.domainProcessors,
    transfers: t.domainTransfers,
    governance: t.domainGovernance,
  };
  return labels[domain];
}

export function statusLabel(t: ControlsMessages, status: ControlStatus): string {
  if (status === 'pass') return t.statusPass;
  if (status === 'fail') return t.statusFail;
  return t.statusPending;
}

export function typeLabel(t: ControlsMessages, type: ControlType): string {
  if (type === 'preventive') return t.typePreventive;
  if (type === 'detective') return t.typeDetective;
  return t.typeCorrective;
}

export function automationLabel(t: ControlsMessages, automation: AutomationLevel): string {
  if (automation === 'auto') return t.automationAuto;
  if (automation === 'semi') return t.automationSemi;
  return t.automationManual;
}
