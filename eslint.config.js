// @ts-check
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore build output and deps
  { ignores: ['dist/', 'node_modules/'] },

  // JS base rules + browser globals for all files
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },

  // React rules — manually configured to avoid legacy parserOptions conflict
  {
    plugins: { react: reactPlugin },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      // New JSX transform — no import React needed in every file
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // TypeScript handles prop types
    },
  },

  // React hooks rules
  reactHooks.configs.flat['recommended-latest'],

  // JSX accessibility rules — downgraded to warn for incremental adoption
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: Object.fromEntries(
      Object.entries(jsxA11y.configs.recommended.rules).map(([rule, def]) => {
        // Rule can be 'error' | 2 | ['error', ...opts] | [2, ...opts]
        const isArray = Array.isArray(def);
        const level = isArray ? def[0] : def;
        const opts = isArray ? def.slice(1) : [];
        const newLevel = level === 'error' || level === 2 ? 'warn' : level;
        return [rule, opts.length > 0 ? [newLevel, ...opts] : newLevel];
      }),
    ),
  },

  // TypeScript rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,

      // TypeScript already enforces undefined checks — disable duplicate rule
      'no-undef': 'off',

      // Allow explicit any only as a warning — fix gradually
      '@typescript-eslint/no-explicit-any': 'warn',

      // Unused vars: allow _-prefixed to intentionally ignore
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // No unused JS vars (defer to TS rule above for TS files)
      'no-unused-vars': 'off',

      // React hooks exhaustive-deps — warn to prevent stale closures
      'react-hooks/exhaustive-deps': 'warn',

      // setState in effect is a valid pattern for syncing state with location
      'react-hooks/set-state-in-effect': 'off',

      // react/display-name is overly strict for arrow function components
      'react/display-name': 'off',
    },
  },

  // Prettier — must come last to disable conflicting formatting rules
  prettier,
];

