// Puts `localStorage` on globalThis, which is what the file-synced progressStore.ts looks for —
// its own comment names this import. Without it that store falls back to memory and a learner's
// streak resets on every launch. Must run before anything reads the store.
import 'expo-sqlite/localStorage/install';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../src/auth/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1e293b' : '#ffffff' },
          headerTintColor: colorScheme === 'dark' ? '#e2e8f0' : '#0f172a',
          contentStyle: { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc' },
        }}
      />
    </AuthProvider>
  );
}
