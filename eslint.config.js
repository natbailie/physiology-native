// Flat config. The Expo preset bundles the plugins this project's inline disable comments name
// (`react-hooks`, `@typescript-eslint`) — `react-hooks/rules-of-hooks` and `react-hooks/refs` in
// particular, which catch hooks and refs used outside a component body.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'expo-env.d.ts',

      // File-synced copies of ../physiology-app. They are lint-clean under that project's own
      // oxlint config and covered by its 2600-odd tests; linting them here would only report its
      // house style back at us, and any fix would be reverted by `npm run sync`. The copies are
      // policed by `npm run sync:check` instead. The hand-written `nativeLoopConfig.ts` files sit
      // in the same directories and are still linted.
      'src/engine/*.ts',
      'src/engine/*/*.ts',
      '!src/engine/*/nativeLoopConfig.ts',
      'src/shared/assessment/**',
      'src/presentation/presentationTypes.ts',
    ],
  },
];
