export * from './cn';
export * from './format-date';
export * from './result';
export * from './theme';
export * from './direction';
export * from './messages';
export * from './locale-routing';
export * from './slot';
export * from './api-client';
export * from './use-anchored-popover';
export * from './pagination';

/*
 * `./fonts` is deliberately NOT re-exported here. It imports `next/font/google`,
 * which only resolves inside the Next build pipeline — barrelling it would drag
 * that into every component test that imports anything from @shared/lib.
 * Import it by path: `@shared/lib/fonts`.
 *
 * `./logger` is deliberately NOT re-exported here either. It imports
 * `@shared/config`, whose env validation runs as a module-level side effect —
 * barrelling it would pull server-only env vars (DATABASE_URL, etc.) into every
 * client component that imports anything from @shared/lib, and they are
 * undefined in the browser. Import it by path: `@shared/lib/logger`.
 */
