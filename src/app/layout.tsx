import type { Metadata, Viewport } from 'next';
import { getRequestLocale } from '@shared/lib/request-locale';
import { fontVariables } from '@shared/lib/fonts';
import { themeInitScript } from '@shared/lib/theme';
import { LOCALES } from '@shared/types/locale';
import { THEME_COLOR } from '@shared/types/tokens';
import { Providers } from './providers';
import '@styles/globals.css';

export const metadata: Metadata = {
  title: 'Jethur',
  description: 'Multi-workspace platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Generated from theme.json, so the browser chrome cannot drift from the canvas.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR.dark },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved by middleware from the cookie (or negotiated from Accept-Language on a
  // first visit) and forwarded on a request header — see @shared/lib/request-locale.
  // Locale is not a route param under the `cookie` strategy, so every request renders
  // this same layout; only the language changes.
  const locale = await getRequestLocale();
  const { dir } = LOCALES[locale];

  return (
    // `lang` and `dir` are server-rendered, so RTL layout and the correct font are
    // right on first paint — no flash, nothing for the client to correct.
    // `fontVariables` publishes the --font-jethur-* hooks that theme.json's font
    // stacks resolve against; without it every stack silently falls back to system.
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before first paint. Without it, dark-theme users
          see a white flash on every navigation while React hydrates.
          `suppressHydrationWarning` is required on <html> because this script
          mutates the element before React sees it — that is the intent, not a bug.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
