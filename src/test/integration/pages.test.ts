/**
 * Boots a real production server (`next build` + `next start`) and requests every
 * page route the app router serves, asserting none of them responds with a 5xx.
 *
 * Why a real server instead of rendering components directly: every page here is
 * an async Server Component that reads `headers()` (see `getRequestLocale`) through
 * Next's request context — that context only exists inside a running Next server,
 * so faking it would test our mock of the framework instead of the real render
 * path. docs/TESTING.md's "never mock" rule is written about the database; the
 * same reasoning applies to the framework boundary here.
 *
 * Why a production build, not `next dev`: reproducing the reported 500s (per
 * docs/ERROR_FIXING_PROTOCOL.md step 1) showed they were `next dev`'s on-demand
 * compiler racing the very first request to a not-yet-compiled route — confirmed
 * by clearing `.next` and hitting routes cold, both one at a time and concurrently.
 * `next build` pre-compiles every route, so that race cannot occur in what
 * actually ships; production runs stayed 100% clean across repeated full-concurrency
 * sweeps. This suite is the deterministic regression guard for real app-code
 * failures. The `next dev` compile race is a Next.js tooling characteristic this
 * repo doesn't control, and asserting against it here would make the suite
 * inherently flaky, which docs/TESTING.md forbids ("Deterministic: ... no sleeps").
 */
import { type ChildProcessWithoutNullStreams, execFileSync, spawn } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CONTROLS } from '@shared/mock/controls';
import { DATA_SOURCES } from '@shared/mock/data-sources';
import { DPIAS } from '@shared/mock/dpia';
import { RISKS } from '@shared/mock/grc';
import { ACTIVITIES } from '@shared/mock/ropa';

/** Not `Error`/`TypeError`/`RangeError` on purpose — `local/error-handling-contract`
 * bans throwing those bare in `src/**`, because in product code an uncaught raw
 * Error is a bug that should have been an `AppError`. This is test-harness setup
 * failing before any test runs, not a product error path, so it gets its own type
 * instead of reaching for the AppError machinery docs/ERROR_HANDLING.md defines
 * for user-facing failures. */
class TestServerSetupFailure extends Error {}

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'src/app');
const DIST_DIR = '.next-test-pages';
// Run Next's JS entry through node: the .bin shim is a shell script that
// execFileSync/spawn cannot launch on Windows (ENOENT).
const NEXT_BIN = join(ROOT, 'node_modules/next/dist/bin/next');

/**
 * One sample id per dynamic `[id]` route, read from the same mock data the page
 * itself reads — see `DYNAMIC_SAMPLES` usage in `discoverRoutes` below. If that
 * mock data ever goes empty, the sample is `undefined` and the coverage test in
 * the `dynamic routes have a sample id to test against` block fails loudly,
 * instead of this suite silently skipping the route it was meant to check.
 *
 * `/notices/[id]` and its `/preview` child are real, DB-backed routes with no mock
 * array to sample from — a placeholder id is enough here, since this suite only
 * asserts "not a 5xx"; a nonexistent notice legitimately 404s through the real API.
 */
const NOTICE_SAMPLE_ID = '00000000-0000-0000-0000-000000000000';

const DYNAMIC_SAMPLES: Record<string, string | undefined> = {
  '/controls/[id]': CONTROLS[0]?.id,
  '/dpia/[id]': DPIAS[0]?.id,
  '/risks/[id]': RISKS[0]?.id,
  '/ropa/[id]': ACTIVITIES[0]?.id,
  '/ropa/[id]/edit': ACTIVITIES[0]?.id,
  '/notices/[id]': NOTICE_SAMPLE_ID,
  '/notices/[id]/preview': NOTICE_SAMPLE_ID,
  '/data-sources/[id]': DATA_SOURCES[0]?.id,
};

type Route = { pattern: string; url: string };

function isRouteGroup(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')');
}

function resolveDynamicUrl(pattern: string): string {
  const sample = DYNAMIC_SAMPLES[pattern];
  return sample ? pattern.replace('[id]', sample) : pattern;
}

/**
 * Walks `src/app`, collecting one route per directory that has a `page.tsx` —
 * so a new page gets covered by this suite automatically, the same way a new
 * dynamic route gets caught by the coverage test if nobody adds it to
 * `DYNAMIC_SAMPLES`. Route groups (`(app)`, `(auth)`) are invisible in the URL,
 * same as Next treats them.
 */
function discoverRoutes(dir: string, segments: string[], out: Route[]): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === 'page.tsx')) {
    const pattern = `/${segments.filter((s) => !isRouteGroup(s)).join('/')}`;
    out.push({ pattern, url: pattern.includes('[') ? resolveDynamicUrl(pattern) : pattern });
  }
  for (const entry of entries) {
    if (entry.isDirectory()) discoverRoutes(join(dir, entry.name), [...segments, entry.name], out);
  }
}

const routes: Route[] = [];
discoverRoutes(APP_DIR, [], routes);
const dynamicRoutes = routes.filter((route) => route.pattern.includes('['));

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, () => {
      const address = probe.address();
      if (typeof address === 'object' && address !== null) {
        const { port } = address;
        probe.close(() => {
          resolve(port);
        });
        return;
      }
      probe.close();
      reject(new TestServerSetupFailure('Could not allocate a free port for the test server.'));
    });
  });
}

async function waitUntilServing(url: string, proc: ChildProcessWithoutNullStreams): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      throw new TestServerSetupFailure(
        `next start exited (code ${String(proc.exitCode)}) before it began serving requests.`,
      );
    }
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new TestServerSetupFailure('Timed out waiting for the production server to start.');
}

let serverProcess: ChildProcessWithoutNullStreams | undefined;
let baseUrl = '';

beforeAll(async () => {
  const buildEnv = {
    DATABASE_URL: 'postgres://app_user:change_me@localhost:5432/jethur',
    APP_BASE_DOMAIN: 'localhost:3000',
    ...process.env,
    NEXT_DIST_DIR: DIST_DIR,
  };
  // Remove any stale output directory left by an interrupted previous run
  // (afterAll's rmSync only fires when vitest exits cleanly; Ctrl-C skips it,
  // leaving partial .nft.json trace files that make `next build` fail with ENOENT).
  rmSync(join(ROOT, DIST_DIR), { recursive: true, force: true });
  execFileSync(process.execPath, [NEXT_BIN, 'build'], {
    cwd: ROOT,
    env: buildEnv,
    stdio: 'ignore',
  });

  const port = await getFreePort();
  baseUrl = `http://localhost:${String(port)}`;
  serverProcess = spawn(process.execPath, [NEXT_BIN, 'start', '-p', String(port)], {
    cwd: ROOT,
    env: buildEnv,
  });

  await waitUntilServing(`${baseUrl}/login`, serverProcess);
}, 180_000);

afterAll(() => {
  serverProcess?.kill();
  rmSync(join(ROOT, DIST_DIR), { recursive: true, force: true });
});

describe('dynamic routes have a sample id to test against', () => {
  it.each(dynamicRoutes)('$pattern resolves to a concrete url', (route) => {
    expect(route.url).not.toBe(route.pattern);
  });
});

describe('every page renders without a server error', () => {
  it.each(routes)('GET $url does not respond with a 5xx', async (route) => {
    const response = await fetch(`${baseUrl}${route.url}`);
    expect(response.status).toBeLessThan(500);
  });

  it('serves every discovered page concurrently without a 5xx', async () => {
    const results = await Promise.all(
      routes.map(async (route) => ({ route, response: await fetch(`${baseUrl}${route.url}`) })),
    );
    results.forEach(({ route, response }) => {
      expect(response.status, `unexpected status for ${route.url}`).toBeLessThan(500);
    });
  });
});
