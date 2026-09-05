import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNativeEntitlement } from '../../../../src/purchases/useNativeEntitlement';
import { MODULES, THEMES } from '../../../../src/home/moduleRegistry';
import { useModuleProgress } from '../../../../src/home/useModuleProgress';
import { ModuleCard } from '../../../../src/presentation/cards/ModuleCard';
import { FONT, LINE, SPACE, useAppTheme } from '../../../../src/presentation/theme';

/**
 * The drill-down tier: one theme's worth of module cards, with the lock state on each.
 *
 * This is where the entitlement boundary becomes visible. Until now the native app rendered all
 * 45 modules as identical open tiles and only refused at the module screen, so a learner met the
 * paywall as a dead end rather than as a shape they could see the size of.
 */
export default function ThemeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  const { isUnlocked } = useNativeEntitlement();
  const { progress } = useModuleProgress();

  const theme = THEMES.find((t) => t.id === id);

  if (!theme) {
    return (
      <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={[styles.blurb, { color: color.textDim }]}>That theme does not exist.</Text>
      </ScrollView>
    );
  }

  const modules = MODULES.filter((module) => module.theme === theme.id);

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: theme.name }} />

      <Text style={[styles.blurb, { color: color.textDim }]}>{theme.blurb}</Text>

      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          {...(progress[module.id] ?? { dueCount: 0 })}
          locked={module.status === 'available' && !isUnlocked(module.id)}
          onPress={() => router.push(`/module/${module.id}`)}
          onPressLocked={() => router.push('/pricing')}
        />
      ))}

      <Text style={[styles.footnote, { color: color.textFaint }]}>
        These are simplified, conceptual models built to teach mechanism — not clinical or
        diagnostic tools.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACE.xl, gap: SPACE.lg },
  blurb: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  footnote: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.snug, marginTop: SPACE.md },
});
