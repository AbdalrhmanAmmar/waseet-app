const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', '.expo/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@react-navigation/*'], message: 'Use Expo Router 57 entry points.' },
            {
              group: ['**/reactnative/**'],
              message: 'The Expo application must be self-contained.',
            },
          ],
        },
      ],
    },
  },
]);
