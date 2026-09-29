import { createRequire } from 'node:module';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import prettier from 'eslint-config-prettier';

const require = createRequire(import.meta.url);
/** Local rules that encode this repo's non-negotiable conventions. See tooling/eslint-rules. */
const local = require('./tooling/eslint-rules/index.js');

/**
 * We wire @next/eslint-plugin-next directly rather than extending
 * `eslint-config-next`: that package is still eslintrc-only and loads
 * @rushstack/eslint-patch, which breaks on current ESLint 9. Same rules, no patch.
 */
const nextRules = {
  ...nextPlugin.configs.recommended.rules,
  ...nextPlugin.configs['core-web-vitals'].rules,
};

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      '.next-test*/**',
      'node_modules/**',
      'storybook-static/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },

  js.configs.recommended,

  // ---------------------------------------------------------------------------
  // Application source: full type-aware linting + every repo convention.
  // ---------------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}', '*.config.ts', 'next.config.ts'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { local, '@next/next': nextPlugin, 'react-hooks': reactHooks },
    rules: {
      ...nextRules,
      ...reactHooks.configs.recommended.rules,

      // ---- Repo conventions, enforced (see docs/) --------------------------
      'local/no-hardcoded-design-values': 'error',
      'local/no-arbitrary-tailwind': 'error',
      'local/no-physical-direction': 'error',
      'local/no-literal-ui-text': 'error',
      'local/tier-boundary': 'error',
      'local/require-workspace-scope': 'error',
      'local/error-handling-contract': 'error',

      // ---- Correctness / safety -------------------------------------------
      // CONVENTIONS.md: prefer `type` to `interface` unless merging is needed.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Use @shared/lib/storage — SSR-safe and audited.' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],

      // ---- Reusability / readability ---------------------------------------
      complexity: ['warn', 12],
      'max-depth': ['warn', 4],
      // ~300 lines is the investigate-it signal (CONVENTIONS.md); 800 is the hard
      // ceiling — past it, split into composable modules/hooks/components instead
      // of growing the file further.
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a const object + union type instead of enum (erasable, tree-shakeable).',
        },
      ],
    },
  },

  ...storybook.configs['flat/recommended'],

  // Server code logs through the structured logger only.
  { files: ['src/server/**/*.ts'], rules: { 'no-console': 'error' } },

  // Stories/tests: relax size budgets, keep every safety rule.
  {
    files: ['**/*.stories.tsx', '**/*.test.{ts,tsx}'],
    rules: { 'max-lines-per-function': 'off', 'max-lines': 'off' },
  },

  // GENERATED files (see the "GENERATED from" header each one carries) —
  // regenerated wholesale by `pnpm ds:tokens`/`ds:i18n`/`ds:manifest` from
  // theme.json/locales.json/contract.json. Their length tracks the size of the
  // design system and message catalogue, not a human's file-organisation
  // choices, so the size budget below doesn't apply to them.
  {
    files: [
      'src/shared/types/messages.ts',
      'src/shared/types/catalogues.ts',
      'src/shared/types/locale.ts',
      'src/shared/types/tokens.ts',
    ],
    rules: { 'max-lines': 'off' },
  },

  // ---------------------------------------------------------------------------
  // Tooling + root config files: plain JS linting, no type information.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node }, sourceType: 'module' },
    rules: { 'no-console': 'off' },
  },

  // Ops/build scripts written in TypeScript (e.g. tooling/scripts/migrate.ts).
  // They run under Node via `--experimental-strip-types`, outside the app — full
  // type-aware linting (tsconfig already covers **/*.ts), but none of the
  // component/workspace-isolation conventions that only apply to src/**.
  {
    files: ['tooling/**/*.ts'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },

  prettier,
);
