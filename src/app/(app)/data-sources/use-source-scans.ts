'use client';

/**
 * Runs the read-only scan and connect simulations that stand in for a scanner.
 *
 * The progress lives here, keyed by source id, rather than on each row: a row is
 * remounted whenever the register re-sorts or the user switches between the tree
 * and table views, and progress kept inside it would restart from zero every
 * time. Completion writes the result back to the store, so the finished state
 * survives navigation the same way the row itself does.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataSource } from '@shared/mock/data-sources';
import { patchSource } from '@shared/mock/data-sources-store';

export type ScanPhase = 'scanning' | 'connecting';
export type ScanRunState = { phase: ScanPhase; progress: number };
export type ScanRuns = Readonly<Record<string, ScanRunState | undefined>>;

const TICK_MS = 320;
/** A bar that starts at zero reads as "nothing is happening yet". */
const START_PERCENT = 5;
/** Chosen so the bar lands just short of full before the run completes. */
const STEP_PERCENT = 22;

export type ScanController = {
  runs: ScanRuns;
  /** Re-scans an already-connected source. */
  startScan: (source: DataSource) => void;
  /** Connects a source, then runs its first scan and applies the result. */
  connect: (source: DataSource) => void;
  /** Scans every connected source, staggered so the register stays readable. */
  scanAll: (sources: readonly DataSource[]) => void;
};

export function useSourceScans(): ScanController {
  const [runs, setRuns] = useState<ScanRuns>({});
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearInterval(timer);
      pending.clear();
    };
  }, []);

  const run = useCallback((id: string, phase: ScanPhase, onComplete: () => void) => {
    const existing = timers.current.get(id);
    if (existing) clearInterval(existing);

    // Progress is tracked in this closure rather than read back out of state:
    // a `setRuns` updater runs during render, not when it is called, so the
    // interval cannot use it to decide whether the run has finished.
    let progress = START_PERCENT;
    setRuns((current) => ({ ...current, [id]: { phase, progress } }));

    const timer = setInterval(() => {
      progress += STEP_PERCENT;
      if (progress < 100) {
        setRuns((current) => ({ ...current, [id]: { phase, progress } }));
        return;
      }
      clearInterval(timer);
      timers.current.delete(id);
      setRuns((current) => {
        const { [id]: _finished, ...rest } = current;
        return rest;
      });
      onComplete();
    }, TICK_MS);

    timers.current.set(id, timer);
  }, []);

  const startScan = useCallback(
    (source: DataSource) => {
      run(source.id, 'scanning', () => {
        patchSource(source.id, {
          lastScanLabel: 'Just now',
          lastScanDetail: 'Scan complete · no changes',
        });
      });
    },
    [run],
  );

  const connect = useCallback(
    (source: DataSource) => {
      // The connection itself succeeds immediately; the first scan is what takes
      // time. Holding the row at "not connected" until the scan finishes would
      // report the wrong one of the two as still in flight.
      patchSource(source.id, { status: 'connected' });
      run(source.id, 'connecting', () => {
        // A source with no declared result came back clean — the honest default,
        // since claiming findings we did not simulate would be worse than none.
        const result = source.connectResult ?? { pii: 'no' as const, categories: [] };
        patchSource(source.id, {
          pii: result.pii,
          categories: result.categories,
          lastScanLabel: 'Just now',
          lastScanDetail: 'First scan complete',
        });
      });
    },
    [run],
  );

  const scanAll = useCallback(
    (sources: readonly DataSource[]) => {
      sources
        .filter((source) => source.status === 'connected')
        .forEach((source) => {
          startScan(source);
        });
    },
    [startScan],
  );

  return { runs, startScan, connect, scanAll };
}
