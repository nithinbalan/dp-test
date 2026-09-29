/**
 * MOCK DATA — see the note in `workspace.ts`. The connector catalogue a real
 * integration layer would eventually back.
 *
 * Shape mirrors the source design's four-category browse: a connector belongs to
 * exactly one CATEGORY (what kind of thing it is — app, cloud, database, file
 * store), and SaaS apps additionally carry a GROUP so the ~70 of them can be
 * browsed by what the business uses them for rather than as one flat wall.
 *
 * Display names and vendor descriptions live here because they are proper nouns
 * and vendor copy, not product vocabulary. Everything the product says ABOUT a
 * connector — category headings, group headings, the fixed database form —
 * resolves from `public/lang/<locale>/data-sources.json` instead.
 */
import { CONNECTOR_CATALOGUE } from './connector-catalogue';

/** What kind of thing a connector connects to. The wizard's first level. */
export type ConnectorCategory = 'app' | 'cloud' | 'db' | 'file';

/** What a SaaS app is used for. The wizard's second level, apps only. */
export type ConnectorGroup =
  | 'accounting'
  | 'hr'
  | 'crm'
  | 'payments'
  | 'support'
  | 'communication'
  | 'marketing'
  | 'ecommerce'
  | 'kyc'
  | 'engineering'
  | 'storage'
  | 'other';

/** Order the wizard renders group headings in. */
export const CONNECTOR_GROUP_ORDER: readonly ConnectorGroup[] = [
  'accounting',
  'hr',
  'crm',
  'payments',
  'support',
  'communication',
  'marketing',
  'ecommerce',
  'kyc',
  'engineering',
  'storage',
  'other',
];

/** Order the wizard renders categories in. */
export const CONNECTOR_CATEGORY_ORDER: readonly ConnectorCategory[] = [
  'app',
  'cloud',
  'db',
  'file',
];

export type ConnectorFieldControl = 'text' | 'password' | 'number' | 'select';

/**
 * One input on the connection step. Cloud, file and app connectors each need a
 * different set, so the set travels with the connector rather than being branched
 * on in the form. Database connectors are the exception: their form is identical
 * across every engine, so it is rendered from translated copy instead.
 */
export type ConnectorField = {
  key: string;
  label: string;
  control: ConnectorFieldControl;
  /** Placeholder for text inputs; the `|`-free option list for selects. */
  placeholder?: string | undefined;
  options?: readonly string[] | undefined;
  isRequired: boolean;
};

/** A database the scanner found on the server, offered for selection. */
export type ConnectorDatabase = { name: string; detail: string };

export type Connector = {
  id: string;
  name: string;
  category: ConnectorCategory;
  /** Apps only — the browse heading this sits under. */
  group?: ConnectorGroup | undefined;
  description: string;
  /** Single-letter mark shown in a tinted square — stands in for a real logo. */
  mark: string;
  fields: readonly ConnectorField[];
  /** Database connectors only. */
  port?: number | undefined;
  userHint?: string | undefined;
  databases?: readonly ConnectorDatabase[] | undefined;
};

export const CONNECTORS: readonly Connector[] = CONNECTOR_CATALOGUE;

export function getConnector(id: string | undefined): Connector | undefined {
  if (id === undefined) return undefined;
  return CONNECTORS.find((connector) => connector.id === id);
}

export function getConnectorsInCategory(category: ConnectorCategory): readonly Connector[] {
  return CONNECTORS.filter((connector) => connector.category === category);
}

/**
 * Search runs across every category, not just the one the user is standing in —
 * someone who types "razorpay" while browsing Databases means the app, and a
 * search scoped to the current level would tell them it does not exist.
 */
export function searchConnectors(query: string): readonly Connector[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [];
  return CONNECTORS.filter((connector) =>
    `${connector.name} ${connector.description} ${connector.id}`.toLowerCase().includes(needle),
  );
}
