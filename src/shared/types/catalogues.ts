/* GENERATED from public/lang/<locale>/<namespace>.json by `pnpm ds:i18n`. Do not edit. */

/**
 * Statically imported so every catalogue is type-checked at build time and
 * bundled deterministically. A dynamic `import(`/lang/${locale}/${ns}.json`)`
 * would defer a missing-catalogue failure to runtime, in production, for one
 * language.
 *
 * These same files also live under public/, so each one is INDEPENDENTLY
 * fetchable at that exact URL (e.g. `/lang/en/auth.json`) — Next.js serves
 * everything under public/ verbatim. Importing them here does not change that;
 * it only means the app itself never pays a network round trip to read its own
 * default-locale strings.
 *
 * No type assertion on the imports below: `pnpm ds:i18n --check` proves each
 * file has exactly the message keys in MessageKeys before this file is ever
 * regenerated, so the JSON's inferred shape already satisfies NamespaceMessages.
 */
import type { Locale } from './locale';
import type { MessageNamespace, NamespaceMessages } from './messages';

import academy_en from '@public/lang/en/academy.json';
import academy_ar from '@public/lang/ar/academy.json';
import academy_de from '@public/lang/de/academy.json';
import actions_en from '@public/lang/en/actions.json';
import actions_ar from '@public/lang/ar/actions.json';
import actions_de from '@public/lang/de/actions.json';
import ai_en from '@public/lang/en/ai.json';
import ai_ar from '@public/lang/ar/ai.json';
import ai_de from '@public/lang/de/ai.json';
import app_en from '@public/lang/en/app.json';
import app_ar from '@public/lang/ar/app.json';
import app_de from '@public/lang/de/app.json';
import auth_en from '@public/lang/en/auth.json';
import auth_ar from '@public/lang/ar/auth.json';
import auth_de from '@public/lang/de/auth.json';
import common_en from '@public/lang/en/common.json';
import common_ar from '@public/lang/ar/common.json';
import common_de from '@public/lang/de/common.json';
import controls_en from '@public/lang/en/controls.json';
import controls_ar from '@public/lang/ar/controls.json';
import controls_de from '@public/lang/de/controls.json';
import dashboard_en from '@public/lang/en/dashboard.json';
import dashboard_ar from '@public/lang/ar/dashboard.json';
import dashboard_de from '@public/lang/de/dashboard.json';
import data_map_en from '@public/lang/en/data-map.json';
import data_map_ar from '@public/lang/ar/data-map.json';
import data_map_de from '@public/lang/de/data-map.json';
import data_sources_en from '@public/lang/en/data-sources.json';
import data_sources_ar from '@public/lang/ar/data-sources.json';
import data_sources_de from '@public/lang/de/data-sources.json';
import dpia_en from '@public/lang/en/dpia.json';
import dpia_ar from '@public/lang/ar/dpia.json';
import dpia_de from '@public/lang/de/dpia.json';
import employees_en from '@public/lang/en/employees.json';
import employees_ar from '@public/lang/ar/employees.json';
import employees_de from '@public/lang/de/employees.json';
import endpoints_en from '@public/lang/en/endpoints.json';
import endpoints_ar from '@public/lang/ar/endpoints.json';
import endpoints_de from '@public/lang/de/endpoints.json';
import errors_en from '@public/lang/en/errors.json';
import errors_ar from '@public/lang/ar/errors.json';
import errors_de from '@public/lang/de/errors.json';
import modules_en from '@public/lang/en/modules.json';
import modules_ar from '@public/lang/ar/modules.json';
import modules_de from '@public/lang/de/modules.json';
import notices_en from '@public/lang/en/notices.json';
import notices_ar from '@public/lang/ar/notices.json';
import notices_de from '@public/lang/de/notices.json';
import readiness_en from '@public/lang/en/readiness.json';
import readiness_ar from '@public/lang/ar/readiness.json';
import readiness_de from '@public/lang/de/readiness.json';
import risks_en from '@public/lang/en/risks.json';
import risks_ar from '@public/lang/ar/risks.json';
import risks_de from '@public/lang/de/risks.json';
import ropa_en from '@public/lang/en/ropa.json';
import ropa_ar from '@public/lang/ar/ropa.json';
import ropa_de from '@public/lang/de/ropa.json';
import settings_en from '@public/lang/en/settings.json';
import settings_ar from '@public/lang/ar/settings.json';
import settings_de from '@public/lang/de/settings.json';
import workspace_en from '@public/lang/en/workspace.json';
import workspace_ar from '@public/lang/ar/workspace.json';
import workspace_de from '@public/lang/de/workspace.json';

export const CATALOGUES: {
  readonly [N in MessageNamespace]: Readonly<Record<Locale, NamespaceMessages<N>>>;
} = {
  academy: {
    en: academy_en,
    ar: academy_ar,
    de: academy_de,
  },
  actions: {
    en: actions_en,
    ar: actions_ar,
    de: actions_de,
  },
  ai: {
    en: ai_en,
    ar: ai_ar,
    de: ai_de,
  },
  app: {
    en: app_en,
    ar: app_ar,
    de: app_de,
  },
  auth: {
    en: auth_en,
    ar: auth_ar,
    de: auth_de,
  },
  common: {
    en: common_en,
    ar: common_ar,
    de: common_de,
  },
  controls: {
    en: controls_en,
    ar: controls_ar,
    de: controls_de,
  },
  dashboard: {
    en: dashboard_en,
    ar: dashboard_ar,
    de: dashboard_de,
  },
  'data-map': {
    en: data_map_en,
    ar: data_map_ar,
    de: data_map_de,
  },
  'data-sources': {
    en: data_sources_en,
    ar: data_sources_ar,
    de: data_sources_de,
  },
  dpia: {
    en: dpia_en,
    ar: dpia_ar,
    de: dpia_de,
  },
  employees: {
    en: employees_en,
    ar: employees_ar,
    de: employees_de,
  },
  endpoints: {
    en: endpoints_en,
    ar: endpoints_ar,
    de: endpoints_de,
  },
  errors: {
    en: errors_en,
    ar: errors_ar,
    de: errors_de,
  },
  modules: {
    en: modules_en,
    ar: modules_ar,
    de: modules_de,
  },
  notices: {
    en: notices_en,
    ar: notices_ar,
    de: notices_de,
  },
  readiness: {
    en: readiness_en,
    ar: readiness_ar,
    de: readiness_de,
  },
  risks: {
    en: risks_en,
    ar: risks_ar,
    de: risks_de,
  },
  ropa: {
    en: ropa_en,
    ar: ropa_ar,
    de: ropa_de,
  },
  settings: {
    en: settings_en,
    ar: settings_ar,
    de: settings_de,
  },
  workspace: {
    en: workspace_en,
    ar: workspace_ar,
    de: workspace_de,
  },
};
