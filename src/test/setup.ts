/**
 * Global test setup.
 *
 * Testing Library's automatic cleanup only registers when Vitest globals are on.
 * We keep `globals: false` (explicit imports, per docs/CONVENTIONS.md), so cleanup
 * is wired here instead. Without it, renders accumulate across tests in one file
 * and queries fail with "multiple elements found" — shared mutable state between
 * tests, which docs/TESTING.md forbids.
 */
import { existsSync } from 'node:fs';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Prefer a developer's real local Postgres credentials from .env.local when present —
// src/server/workspace/__tests__/isolation.test.ts needs a real, provisioned database
// (docs/WORKSPACE_ISOLATION.md §7 requires it; mocks cannot prove connection-level
// behaviour). CI sets DATABASE_URL/DATABASE_MIGRATION_URL directly as process env vars
// and has no .env.local file, so this is a no-op there — checked explicitly rather than
// via try/catch so there is no empty catch block to swallow a real load failure.
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

// Provide required test environment variables so env.ts validation succeeds in tests
// that never touch a real database (most of them — see above for the one that does).
process.env.DATABASE_URL ??= 'postgres://app_user:change_me@localhost:5432/jethur';
process.env.APP_BASE_DOMAIN ??= 'localhost:3000';

afterEach(() => {
  cleanup();
});

/**
 * jsdom does not implement matchMedia. Anything reading `prefers-color-scheme`
 * throws without this.
 *
 * It is stubbed HERE rather than guarded in `resolveTheme`, because every real
 * browser has matchMedia — adding a runtime fallback would be suppressing a
 * test-environment gap inside production code. See docs/ERROR_FIXING_PROTOCOL.md.
 */
// The DOM lib types matchMedia as always present, which is true of browsers and
// false of jsdom. Widening the type here states that honestly, rather than
// suppressing the check that correctly reports the lie.
// Omit, not intersect: intersecting keeps the original required property.
const testWindow = window as Omit<Window, 'matchMedia'> & {
  matchMedia?: Window['matchMedia'];
};

testWindow.matchMedia ??= (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;
