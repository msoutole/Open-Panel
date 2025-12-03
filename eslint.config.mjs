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
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        'no-console': ['warn', { allow: ['warn', 'error'] }]
      }
    }
  )
  ,
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
