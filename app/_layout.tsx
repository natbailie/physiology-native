// Puts `localStorage` on globalThis, which is what the file-synced progressStore.ts looks for —
// its own comment names this import. Without it that store falls back to memory and a learner's
// streak resets on every launch. Must run before anything reads the store.
import 'expo-sqlite/localStorage/install';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/auth/AuthContext';
import { useAppTheme } from '../src/presentation/theme';

/**
 * The root stack. It holds the tab group plus the two screens that push OVER the tabs:
 *
 *   * `module/[id]` — a simulator wants the whole screen. Losing 49pt of it to a tab bar for the
 *     length of a study session is the wrong trade, and the diagram is the thing being cropped.
 *   * `pricing` — reached from the Account tab and from a locked module's paywall, and it is a
 *     destination rather than a section.
 *
 * `SafeAreaProvider` is new. `react-native-safe-area-context` has been a dependency all along and
 * was entirely unused, so content ran under the home indicator on every screen; with a tab bar it
 * would have run under that too.
 */
function RootNavigator() {
  const { isDark, color } = useAppTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.panel },
          headerTintColor: color.text,
          headerTitleStyle: { color: color.text },
          contentStyle: { backgroundColor: color.bg },
        }}
      >
        {/* The title is what the back button on a pushed screen reads, so it is set even though
            this screen shows no header of its own — without it the group name, "(tabs)", leaks
            into the module screen's back button. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Study' }} />
        <Stack.Screen name="module/[id]" options={{ headerBackTitle: 'Study' }} />
        <Stack.Screen name="pricing" options={{ title: 'Full access' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
