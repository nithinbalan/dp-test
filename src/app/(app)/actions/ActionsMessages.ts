import type { Translate } from '@shared/lib';
import type { ActionPriority, ActionSourceType, ActionStatus } from '@shared/mock/grc';

/** Page-local — copy for the Action Plans register, resolved server-side in page.tsx. */
export type ActionsMessages = {
  kpiTotal: string;
  kpiTodo: string;
  kpiInProgress: string;
  kpiDone: string;
  searchPlaceholder: string;
  statusAll: string;
  statusTodo: string;
  statusInProgress: string;
  statusDone: string;
  statusFilterLabel: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  tableCaption: string;
  tableAction: string;
  tableSource: string;
  tableOwner: string;
  tableDue: string;
  tablePriority: string;
  tableStatus: string;
  tableActions: string;
  markDoneLabel: string;
  toastMarkedDone: string;
  sourceRisk: string;
  sourceDpia: string;
};

export function resolveActionsMessages(t: Translate<'actions'>): ActionsMessages {
  return {
    kpiTotal: t('kpiTotal'),
    kpiTodo: t('kpiTodo'),
    kpiInProgress: t('kpiInProgress'),
    kpiDone: t('kpiDone'),
    searchPlaceholder: t('searchPlaceholder'),
    statusAll: t('statusAll'),
    statusTodo: t('statusTodo'),
    statusInProgress: t('statusInProgress'),
    statusDone: t('statusDone'),
    statusFilterLabel: t('statusFilterLabel'),
    priorityHigh: t('priorityHigh'),
    priorityMedium: t('priorityMedium'),
    priorityLow: t('priorityLow'),
    tableCaption: t('tableCaption'),
    tableAction: t('tableAction'),
    tableSource: t('tableSource'),
    tableOwner: t('tableOwner'),
    tableDue: t('tableDue'),
    tablePriority: t('tablePriority'),
    tableStatus: t('tableStatus'),
    tableActions: t('tableActions'),
    markDoneLabel: t('markDoneLabel'),
    toastMarkedDone: t('toastMarkedDone'),
    sourceRisk: t('sourceRisk'),
    sourceDpia: t('sourceDpia'),
  };
}

export function actionStatusLabel(t: ActionsMessages, status: ActionStatus): string {
  if (status === 'todo') return t.statusTodo;
  if (status === 'in-progress') return t.statusInProgress;
  return t.statusDone;
}

export function actionPriorityLabel(t: ActionsMessages, priority: ActionPriority): string {
  if (priority === 'high') return t.priorityHigh;
  if (priority === 'medium') return t.priorityMedium;
  return t.priorityLow;
}

export function actionSourceLabel(t: ActionsMessages, source: ActionSourceType): string {
  return source === 'risk' ? t.sourceRisk : t.sourceDpia;
}
