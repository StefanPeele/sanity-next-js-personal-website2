import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

// eslint.config.mjs
// next/core-web-vitals + typescript-eslint recommended. The React Compiler rules from
// eslint-plugin-react-hooks are kept. Rules that would flood a Sanity/Next codebase with
// noise (explicit `any` at CMS boundaries, unused underscore args) are downgraded below.

export default defineConfig([
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'public/**',
    'node_modules/**',
    'sanity.types.ts',
    'schema.json',
    'playwright-report/**',
    'test-results/**',
  ]),
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    rules: {
      // CMS payloads reach components as `any` in a few places; fix incrementally.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      // React Compiler diagnostics from eslint-plugin-react-hooks 7. They flag real
      // patterns worth fixing but pre-date the compiler in a dozen components; warn
      // until each is addressed (see README "Lint").
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      // Sanity uses `require` in a couple of config files.
      '@typescript-eslint/no-require-imports': 'off',
      // `<img>` is deliberate in a few decorative/feed spots; keep as a warning.
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
])
