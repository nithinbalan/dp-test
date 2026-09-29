import type { StorybookConfig } from '@storybook/nextjs-vite';

/**
 * Vite-based Next framework. The webpack builder in @storybook/nextjs collides with
 * Next 15.5's bundled webpack; nextjs-vite is the maintained path and is much faster.
 */
const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y', // accessibility is part of the definition of done
  ],
  framework: { name: '@storybook/nextjs-vite', options: {} },
  staticDirs: ['../public'],
};

export default config;
