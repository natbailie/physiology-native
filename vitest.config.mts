import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      // Components import from 'react-native'; under test they render through the web
      // implementation, which @testing-library/react drives in jsdom. This mirrors the web
      // app's vitest setup — same runner, same style of test — rather than adding a second
      // (jest) stack for the one repo that would then own it.
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
