import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import neostandard from 'neostandard'

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/template/**']),
  ...neostandard({
    ts: true,
    filesTs: ['**/*.{ts,tsx}'],
  }),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  }
])
