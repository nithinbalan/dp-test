/**
 * MOCK DATA — see the note in `workspace.ts`. Datasets discovered on
 * connected sources (or added by hand), the Data Map's actual content.
 */
import { DATA_SOURCES } from './data-sources';

export type IdentifierType =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'dob'
  | 'aadhaar'
  | 'pan'
  | 'gstin'
  | 'bank'
  | 'salary'
  | 'id_proofs'
  | 'device_ids'
  | 'cv_data'
  | 'child_data'
  | 'health'
  | 'financial';

export const IDENTIFIER_LABELS: Record<IdentifierType, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  dob: 'DOB',
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  gstin: 'GSTIN',
  bank: 'Bank a/c',
  salary: 'Salary',
  id_proofs: 'ID proofs',
  device_ids: 'Device IDs',
  cv_data: 'CV data',
  child_data: 'Child data',
  health: 'Health data',
  financial: 'Financial data',
};

export const SENSITIVE_IDENTIFIERS: readonly IdentifierType[] = [
  'aadhaar',
  'pan',
  'bank',
  'salary',
  'id_proofs',
  'child_data',
  'health',
  'financial',
];

export type Dataset = {
  id: string;
  name: string;
  sourceId: string;
  identifierTypes: IdentifierType[];
  recordCount: number;
  isLinkedToRopa: boolean;
};

function sourceName(id: string): string {
  return DATA_SOURCES.find((source) => source.id === id)?.name ?? id;
}

export const DATASETS: Dataset[] = [
  {
    id: 'ds-1',
    name: 'customers',
    sourceId: 'src-1',
    identifierTypes: ['name', 'email', 'phone', 'financial'],
    recordCount: 4820,
    isLinkedToRopa: true,
  },
  {
    id: 'ds-2',
    name: 'invoices',
    sourceId: 'src-1',
    identifierTypes: ['name', 'pan', 'financial'],
    recordCount: 12300,
    isLinkedToRopa: true,
  },
  {
    id: 'ds-3',
    name: 'employees',
    sourceId: 'src-2',
    identifierTypes: ['name', 'email', 'phone', 'address', 'aadhaar', 'financial'],
    recordCount: 45,
    isLinkedToRopa: true,
  },
  {
    id: 'ds-4',
    name: 'payroll_records',
    sourceId: 'src-2',
    identifierTypes: ['name', 'aadhaar', 'pan', 'financial'],
    recordCount: 45,
    isLinkedToRopa: false,
  },
  {
    id: 'ds-5',
    name: 'leads',
    sourceId: 'src-3',
    identifierTypes: ['name', 'email', 'phone'],
    recordCount: 8900,
    isLinkedToRopa: true,
  },
  {
    id: 'ds-6',
    name: 'opportunities',
    sourceId: 'src-3',
    identifierTypes: ['name', 'email'],
    recordCount: 2100,
    isLinkedToRopa: false,
  },
  {
    id: 'ds-7',
    name: 'transactions',
    sourceId: 'src-4',
    identifierTypes: ['name', 'financial'],
    recordCount: 15600,
    isLinkedToRopa: true,
  },
  {
    id: 'ds-8',
    name: 'support_tickets',
    sourceId: 'src-5',
    identifierTypes: ['name', 'email', 'health'],
    recordCount: 3400,
    isLinkedToRopa: false,
  },
];

export function getSourceNameFor(dataset: Dataset): string {
  return sourceName(dataset.sourceId);
}

export function hasSensitiveIdentifiers(dataset: Dataset): boolean {
  return dataset.identifierTypes.some((type) => SENSITIVE_IDENTIFIERS.includes(type));
}
