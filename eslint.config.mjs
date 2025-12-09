import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const projectGlobs = [
  './tsconfig.json',
  './apps/*/tsconfig.json',
  './packages/*/tsconfig.json'
];

export default [
  {
    ignores: ['node_modules', 'dist', 'build', '.next', 'coverage']
  },
  ...tseslint.config(
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        ...tseslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        prettier
      ],
      languageOptions: {
        parserOptions: {
          project: projectGlobs,
          tsconfigRootDir: import.meta.dirname
        }
      },
      rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }]
      }
    }
  )
  ,
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.integration.test.ts'
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/await-thenable': 'off'
    }
  },
  // Scripts in /scripts and root start are Node CLI scripts using CommonJS require
  {
    files: ['scripts/**/*.{js,ts}', 'start.js', 'scripts/**'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off'
    },
    languageOptions: {
      sourceType: 'script'
    }
  }
];
