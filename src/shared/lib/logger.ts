/**
 * Structured server-side logger — the ONLY sanctioned caller of `console.*` in the
 * codebase. `src/server/**` lint-bans `console.*` outright; server code logs
 * through this module instead. See docs/ERROR_HANDLING.md §7.
 *
 * Each line is one JSON object so a log pipeline can index on `level`/`message`
 * fields rather than parsing free text. `fields` is deliberately a flat, typed
 * record — callers pass known-safe values (codes, ids, counts), never whole
 * objects that might carry unredacted PII. See docs/SECURITY_HYGIENE.md §6.
 *
 * `LOG_LEVEL` (validated in @shared/config) is the threshold: a line below it is
 * dropped before it is even serialised.
 */
import { env } from '@shared/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogFields = Readonly<Record<string, string | number | boolean | null | undefined>>;

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function write(level: LogLevel, message: string, fields?: LogFields): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[env.LOG_LEVEL]) return;

  const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...fields });
  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console -- sanctioned sink; see docs/ERROR_HANDLING.md §7
      console.debug(line);
      return;
    case 'info':
      // eslint-disable-next-line no-console -- sanctioned sink; see docs/ERROR_HANDLING.md §7
      console.info(line);
      return;
    case 'warn':
      console.warn(line);
      return;
    case 'error':
      console.error(line);
      return;
  }
}

/** Structured logger. Import this — never call `console.*` directly. */
export const logger = {
  debug: (message: string, fields?: LogFields) => {
    write('debug', message, fields);
  },
  info: (message: string, fields?: LogFields) => {
    write('info', message, fields);
  },
  warn: (message: string, fields?: LogFields) => {
    write('warn', message, fields);
  },
  error: (message: string, fields?: LogFields) => {
    write('error', message, fields);
  },
};
