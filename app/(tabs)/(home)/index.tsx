import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEntitlement } from '../../../src/billing/useEntitlement';
import { MEDICATIONS } from '../../../src/medications/drugs';
import { DISCIPLINES, MODULES, THEMES, type DisciplineId } from '../../../src/home/moduleRegistry';
import { useModuleProgress } from '../../../src/home/useModuleProgress';
import { useProgressStore } from '../../../src/shared/assessment/useProgressStore';
import { DisciplineCard } from '../../../src/presentation/cards/DisciplineCard';
import { ModuleCard } from '../../../src/presentation/cards/ModuleCard';
import { StudyReport } from '../../../src/presentation/StudyReport';
import { StudyStrip } from '../../../src/presentation/StudyStrip';
import { FONT, LINE, SPACE, TRACKING_TIGHT, useAppTheme } from '../../../src/presentation/theme';

/**
 * The top of the catalogue: pick a subject.
 *
 * This screen used to be a flat `FlatList` of all 45 simulators — the whole catalogue at one
 * altitude, with no locks, no study report and no way to tell a cardiovascular module from an
 * endocrine one without reading its tagline. The web has browsed subjects → themes → modules
 * throughout; this is that first tier, reading from the same file-synced registry rather than a
 * second copy of it.
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  const { isUnlocked } = useEntitlement();
  const { progress, totals, weakSpots } = useModuleProgress();
  const store = useProgressStore();

  const reference = MODULES.find((module) => module.kind === 'reference');

  /**
   * Simulators per subject, counted THROUGH the theme each module belongs to, so a tile can never
   * claim a size the pages below it will not actually show. Reference pages are not simulators
   * and are excluded. Same pass as the web's HomePage.
   */
  const disciplineOf = new Map(THEMES.map((theme) => [theme.id, theme.discipline]));
  const byDiscipline = new Map<DisciplineId, number>();
  for (const module of MODULES) {
    if (!module.theme || module.kind === 'reference') continue;
    const discipline = disciplineOf.get(module.theme);
    if (discipline) byDiscipline.set(discipline, (byDiscipline.get(discipline) ?? 0) + 1);
  }

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: 'Physiology' }} />

      <Text style={[styles.subtitle, { color: color.textDim }]}>
        Interactive feedback-loop simulators for exam prep — pre-med through resident level (UKMLA,
        USMLE, MRCP). Pick a subject to explore.
      </Text>

      <StudyStrip
        dueCount={totals.due}
        streakDays={store.streak()}
        known={totals.known}
        totalQuestions={totals.totalQuestions}
        attempted={totals.attempted}
        reviewModuleId={totals.reviewModuleId}
        reviewModuleName={totals.reviewModuleName}
        onReview={(id) => router.push(`/module/${id}`)}
      />

      <StudyReport weakSpots={weakSpots} onOpenModule={(id) => router.push(`/module/${id}`)} />

      {DISCIPLINES.map((discipline) => {
        const count = byDiscipline.get(discipline.id) ?? 0;
        return (
          <DisciplineCard
            key={discipline.id}
            discipline={discipline}
            countText={
              discipline.id === 'pharmacology'
                ? `${MEDICATIONS.length} classes`
                : `${count} simulator${count === 1 ? '' : 's'}`
            }
            onPress={
              discipline.status !== 'available'
                ? undefined
                : // Pharmacology's one theme IS the hub, so its tile skips the tier that would
                  // hold a single card — the web expresses the same shortcut as an `href`.
                  discipline.href
                  ? () => router.push('/medications')
                  : () => router.push(`/discipline/${discipline.id}`)
            }
          />
        );
      })}

      {reference && (
        <View style={styles.tools}>
          <Text style={[styles.toolsTitle, { color: color.text }]}>Tools</Text>
          <ModuleCard
            module={reference}
            locked={!isUnlocked(reference.id)}
            onPress={() => router.push('/reference')}
            onPressLocked={() => router.push('/pricing')}
            {...(progress[reference.id] ?? {})}
          />
        </View>
      )}

      <Text style={[styles.footnote, { color: color.textFaint }]}>
        These are simplified, conceptual models built to teach mechanism — not clinical or
        diagnostic tools.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACE.xl, gap: SPACE.lg },
  subtitle: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  tools: { gap: SPACE.md, marginTop: SPACE.md },
  toolsTitle: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  footnote: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.snug, marginTop: SPACE.md },
});
