import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

// Flat config for Astro + Svelte + TypeScript
export default tseslint.config(
  // Ignores
  { ignores: ['dist', 'node_modules', '.astro', '.wrangler', 'test-results', 'Crux'] },

  // Base JS recommendations
  js.configs.recommended,

  // TypeScript recommendations
  ...tseslint.configs.recommended,

  // Astro recommended rules (includes processor for .astro)
  ...astro.configs.recommended,
  // A11y rules adapted for Astro (requires eslint-plugin-jsx-a11y)
  ...astro.configs['jsx-a11y-recommended'],

  // Svelte recommendations
  ...svelte.configs.recommended,

  // Global environments
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Additional parser options for Svelte + TS files
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        // Enable project-aware type information (TS-ESLint v8)
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
        // Let eslint-plugin-svelte auto-adjust from Svelte config
        svelteConfig,
      },
    },
  },

  // Prettier integration
  prettier
);
