import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1e293b' : '#ffffff' },
          headerTintColor: colorScheme === 'dark' ? '#e2e8f0' : '#0f172a',
          contentStyle: { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc' },
        }}
      />
    </>
  );
}
