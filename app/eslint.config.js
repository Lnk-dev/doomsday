import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.vite', 'node_modules', 'e2e', 'server/dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow setState in effects for legitimate sync patterns
      'react-hooks/set-state-in-effect': 'off',
      // Allow Date.now() in useMemo/render (we use useState initializer for stability)
      'react-hooks/purity': 'off',
      // Allow static component lookups from maps
      'react-hooks/static-components': 'off',
      // Allow refs in render for tracking values
      'react-hooks/refs': 'off',
      // Allow access before declaration (for hoisted callbacks)
      'react-hooks/immutability': 'off',
      // Allow hooks + non-components in same file
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
