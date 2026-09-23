import { vi } from 'vitest';

// Device capabilities with no jsdom implementation. Both callers already treat them as
// fire-and-forget, so never-resolving stubs change nothing under test.
vi.mock('expo-haptics', () => ({
  selectionAsync: vi.fn(),
  notificationAsync: vi.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Glyph font with no test renderer. Tiles render without their info mark under test.
vi.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// The settle runs after interactions; under test there are none to wait for, so run it inline.
vi.mock('react-native-web', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    InteractionManager: {
      runAfterInteractions: (cb: () => void) => {
        cb();
        return { cancel: () => {} };
      },
    },
  };
});

// Native view hierarchy with no DOM implementation. Insets read zero under test.
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
}));
