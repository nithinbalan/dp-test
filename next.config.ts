import type { NextConfig } from 'next';

/**
 * Security headers are part of the baseline, not an afterthought.
 * See docs/SECURITY_HYGIENE.md §3 before changing anything here.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  typedRoutes: true,
  // Lets the page-smoke-test build into its own output dir (src/test/integration/pages.test.ts)
  // instead of `.next`, so it can run its own `next build` without colliding with a `next dev`
  // you already have open. Every normal command (`next dev`/`build`/`start`) is unaffected.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  eslint: {
    // CI runs lint as its own gate; do not let `next build` silently pass a dirty tree.
    // NOTE: the build prints "Next.js plugin was not detected" — that heuristic looks for
    // the `eslint-config-next` package by name. We wire @next/eslint-plugin-next directly
    // (see eslint.config.mjs); the rules are active. The warning is expected and harmless.
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  headers: () => Promise.resolve([{ source: '/:path*', headers: securityHeaders }]),
};

export default nextConfig;
