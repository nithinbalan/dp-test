/**
 * The three typefaces the product ships, self-hosted by `next/font`.
 *
 * Self-hosted rather than linked from Google's CDN for three reasons that all
 * matter here: no third-party request on a page that renders personal data, no
 * layout shift (Next injects the metric overrides that make the fallback match),
 * and the app still renders correctly with no network at all.
 *
 * Each font exposes a CSS variable, NOT a class name. The variable is what
 * `design-system/theme.json` points its font stacks at, so the choice of typeface
 * stays a token decision rather than something components know about. Attach
 * {@link fontVariables} to <html> and the whole token layer resolves.
 */
import { DM_Mono, DM_Sans, Noto_Sans_Arabic } from 'next/font/google';

/** Latin UI text. Matches the product's visual identity. */
export const fontSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-jethur-sans',
  display: 'swap',
});

/**
 * Arabic UI text. Bound through `--s-font-family` by `:lang(ar)` in
 * design-system/tokens/locale.css — no component branches on locale.
 */
export const fontArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-jethur-arabic',
  display: 'swap',
});

/**
 * Monospace. Carries every machine-ish label in the UI — identifiers, timestamps,
 * column headers, status pills — which is what makes those read as data rather
 * than as prose.
 */
export const fontMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jethur-mono',
  display: 'swap',
});

/**
 * The class list that publishes all three CSS variables. Belongs on <html>, so the
 * variables are in scope for every token that references them.
 */
export const fontVariables = `${fontSans.variable} ${fontArabic.variable} ${fontMono.variable}`;
