import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { fontVariables } from '../src/shared/lib/fonts';
import '../src/styles/globals.css';

/**
 * Theme and direction are driven by `data-theme` / `dir` on <html>, exactly as in
 * the app — no Storybook-specific styling. A story that looks right here therefore
 * looks right in production, which is the only reason visual regression is worth
 * running at all.
 *
 * The direction toolbar matters more than it looks: RTL bugs are invisible to
 * reviewers who cannot read Arabic, so every component gets checked in both
 * directions without anyone needing to speak the language.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = typeof context.globals.theme === 'string' ? context.globals.theme : 'light';
  const dir = typeof context.globals.direction === 'string' ? context.globals.direction : 'ltr';
  const lang = dir === 'rtl' ? 'ar' : 'en';

  // Same font hooks the app puts on <html>, for the same reason: without them the
  // token font stacks fall back to system and Storybook stops matching production.
  for (const cls of fontVariables.split(' ')) document.documentElement.classList.add(cls);

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);

  return Story(context);
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: 'Colour theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Writing direction',
      defaultValue: 'ltr',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'LTR (English)' },
          { value: 'rtl', title: 'RTL (العربية)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
