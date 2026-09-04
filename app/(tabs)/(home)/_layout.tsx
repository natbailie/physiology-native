import { Stack } from 'expo-router';
import { useAppTheme } from '../../../src/presentation/theme';

/**
 * The catalogue's three tiers, mirroring the web's `#home` → `#discipline/<id>` → `#theme/<id>`.
 *
 * A stack rather than one screen with local state, so the hardware back gesture and the header's
 * back button both work the way an iOS user expects, and so a deep link into a theme still has a
 * subject to go back to.
 */
export default function HomeStackLayout() {
  const { color } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.panel },
        headerTintColor: color.text,
        contentStyle: { backgroundColor: color.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Physiology' }} />
      <Stack.Screen name="discipline/[id]" />
      <Stack.Screen name="theme/[id]" />
    </Stack>
  );
}
