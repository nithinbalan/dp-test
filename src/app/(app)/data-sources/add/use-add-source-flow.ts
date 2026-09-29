'use client';

/**
 * All of the wizard's state and the four actions that move it along.
 *
 * Extracted from the component because the flow is where the real decisions
 * live — which fields are required for this connector, when "continue" has to
 * fetch a database list first, what gets written to the register — and reading
 * them next to JSX made both harder to follow.
 */
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@shared/hooks';
import { getConnector, type Connector } from '@shared/mock/connectors';
import { addSource } from '@shared/mock/data-sources-store';
import { formatMessage } from '../format-message';
import {
  ALL_DETECTORS,
  DB_FIELD,
  type AddSourceMessages,
  type AddSourceState,
  type ConnectionTest,
} from './AddSourceWizard.types';
import { buildNewSource } from './build-new-source';

/** Long enough to read as work happening, short enough not to feel broken. */
const SIMULATED_LATENCY_MS = 900;

const INITIAL_STATE: AddSourceState = {
  connectorId: undefined,
  values: {},
  databaseMode: 'all',
  areDatabasesLoaded: false,
  selectedDatabases: [],
  shouldSaveCredentials: false,
  sampling: 'standard',
  schedule: 'daily',
  detectors: ALL_DETECTORS,
};

/** The connection inputs the connector says must be filled before we try it. */
function missingRequiredKeys(connector: Connector, state: AddSourceState): ReadonlySet<string> {
  const missing = new Set<string>();
  const isEmpty = (key: string) => (state.values[key] ?? '').trim().length === 0;
  if (connector.category === 'db') {
    if (isEmpty(DB_FIELD.host)) missing.add(DB_FIELD.host);
    if (isEmpty(DB_FIELD.username)) missing.add(DB_FIELD.username);
    return missing;
  }
  for (const field of connector.fields) {
    // A select always has a value — its first option is the default.
    if (field.isRequired && field.control !== 'select' && isEmpty(field.key))
      missing.add(field.key);
  }
  return missing;
}

/** The form's own state: the values, and which of them failed validation. */
function useConnectionForm() {
  const [state, setState] = useState<AddSourceState>(INITIAL_STATE);
  const [invalidKeys, setInvalidKeys] = useState<ReadonlySet<string>>(new Set());

  const change = useCallback((patch: Partial<AddSourceState>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  // Clearing a field's error as it is typed into, rather than on the next
  // submit, is what stops the form from arguing with someone already fixing it.
  const setValue = useCallback((key: string, value: string) => {
    setInvalidKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setState((current) => ({ ...current, values: { ...current.values, [key]: value } }));
  }, []);

  return { state, setState, invalidKeys, setInvalidKeys, change, setValue };
}

export function useAddSourceFlow(t: AddSourceMessages) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [test, setTest] = useState<ConnectionTest>('untested');
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state, setState, invalidKeys, setInvalidKeys, change, setValue } = useConnectionForm();

  const connector = getConnector(state.connectorId);

  /** Shared by "test connection", "load databases" and "continue". */
  const requireFields = (): boolean => {
    if (!connector) return false;
    const missing = missingRequiredKeys(connector, state);
    setInvalidKeys(missing);
    if (missing.size > 0) setTest('missingFields');
    return missing.size === 0;
  };

  const loadDatabases = (): void => {
    if (!connector || !requireFields()) return;
    const databases = connector.databases ?? [];
    setIsLoadingDatabases(true);
    window.setTimeout(() => {
      setIsLoadingDatabases(false);
      change({
        areDatabasesLoaded: true,
        selectedDatabases: databases.map((database) => database.name),
      });
    }, SIMULATED_LATENCY_MS);
  };

  return {
    step,
    setStep,
    state,
    connector,
    invalidKeys,
    test,
    isLoadingDatabases,
    isSubmitting,
    change,
    setValue,
    loadDatabases,
    selectConnector: (connectorId: string): void => {
      setState({ ...INITIAL_STATE, connectorId });
      setInvalidKeys(new Set());
      setTest('untested');
      setStep(1);
    },
    testConnection: (): void => {
      if (!requireFields()) return;
      setTest('testing');
      window.setTimeout(() => {
        setTest('ok');
      }, SIMULATED_LATENCY_MS);
    },
    continueFromConnect: (): void => {
      if (!connector || !requireFields()) return;
      // Picking specific databases without having loaded them cannot be a real
      // choice, so continuing fetches the list instead of skipping past it.
      if (
        connector.category === 'db' &&
        state.databaseMode === 'selected' &&
        !state.areDatabasesLoaded
      ) {
        loadDatabases();
        return;
      }
      setStep(2);
    },
    submit: (): void => {
      if (!connector) return;
      setIsSubmitting(true);
      window.setTimeout(() => {
        const source = buildNewSource(connector, state);
        addSource(source);
        toast.show({
          label: formatMessage(t.toastAdded, { name: source.name }),
          tone: 'success',
        });
        router.push('/data-sources');
      }, SIMULATED_LATENCY_MS);
    },
  };
}
