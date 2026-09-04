import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MEDICATIONS } from '../../../../src/medications/drugs';
import { DISCIPLINES, MODULES, THEMES } from '../../../../src/home/moduleRegistry';
import { ThemeCard } from '../../../../src/presentation/cards/ThemeCard';
import { FONT, LINE, SPACE, TRACKING_TIGHT, useAppTheme } from '../../../../src/presentation/theme';

/**
 * The middle tier of the catalogue: one subject's worth of theme cards. A port of the web's
 * DisciplinePage, which the native app had no equivalent of at all.
 */
export default function DisciplineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();

  const discipline = DISCIPLINES.find((d) => d.id === id);

  if (!discipline) {
    return (
      <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={[styles.blurb, { color: color.textDim }]}>That subject does not exist.</Text>
      </ScrollView>
    );
  }

  const themes = THEMES.filter((theme) => theme.discipline === discipline.id);

  // Counted in the same pass the grid renders from, so a theme can never claim a module count
  // that the page behind it will not actually display.
  const byTheme = new Map<string, number>();
  for (const module of MODULES) {
    if (module.theme) byTheme.set(module.theme, (byTheme.get(module.theme) ?? 0) + 1);
  }

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: discipline.name }} />

      <Text style={[styles.blurb, { color: color.textDim }]}>{discipline.blurb}</Text>

      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          moduleCount={byTheme.get(theme.id) ?? 0}
          countText={theme.id === 'medications' ? `${MEDICATIONS.length} classes` : undefined}
          onPress={() =>
            theme.id === 'medications' ? router.push('/medications') : router.push(`/theme/${theme.id}`)
          }
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
  title: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
});
