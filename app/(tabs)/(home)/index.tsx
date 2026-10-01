import { useEffect, useState } from 'react';
import { Logo } from '../../../src/presentation/ui/Logo';
import { Stack, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { invalidateStoreEntitlement, useNativeEntitlement } from '../../../src/purchases/useNativeEntitlement';
import { MEDICATIONS } from '../../../src/medications/drugs';
import { DISCIPLINES, MODULES, THEMES, type DisciplineId } from '../../../src/home/moduleRegistry';
import { matchesExam, useExamFilter } from '../../../src/home/examFilter';
import { seedExamFilter } from '../../../src/home/seedExamFilter';
import { useExamProfile } from '../../../src/account/examProfile';
import { ExamFilterBar } from '../../../src/presentation/ExamFilterBar';
import { useModuleProgress } from '../../../src/home/useModuleProgress';
import { DisciplineCard } from '../../../src/presentation/cards/DisciplineCard';
import { ModuleCard } from '../../../src/presentation/cards/ModuleCard';
import { RoundBoard } from '../../../src/presentation/RoundBoard';
import { StudyReport } from '../../../src/presentation/StudyReport';
import { StudyStrip } from '../../../src/presentation/StudyStrip';
import { useRound } from '../../../src/home/useRound';
import { FONT, LINE, RADIUS, SPACE, TRACKING_TIGHT, useAppTheme } from '../../../src/presentation/theme';
import { GradientBox } from '../../../src/presentation/ui/GradientBox';
import { Illustration } from '../../../src/presentation/ui/Illustration';
import { SearchBar } from '../../../src/presentation/ui/SearchBar';
import { Skeleton } from '../../../src/presentation/ui/Skeleton';
import { Button } from '../../../src/presentation/ui/Button';

/** Module id -> display name. Module-scope so `useRound`'s memo sees a stable function. */
const MODULE_NAMES = new Map(MODULES.map((module) => [module.id, module.name]));
const moduleNameOf = (moduleId: string): string => MODULE_NAMES.get(moduleId) ?? moduleId;

/** Every query word has to appear in the module's name or its one-line description. */
function matchesQuery(module: { name: string; tagline: string }, query: string): boolean {
  const haystack = `${module.name} ${module.tagline}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

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
  const entitlement = useNativeEntitlement();
  const { isUnlocked } = entitlement;
  const { progress, totals, weakSpots } = useModuleProgress();
  const round = useRound(moduleNameOf, entitlement);

  const examFilter = useExamFilter();
  const { targetExam, ready: profileReady } = useExamProfile();

  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const [refreshing, setRefreshing] = useState(false);

  // Pull down to ask the store about access again — the one thing on this screen that can be out of
  // date (a purchase made on another device, a school code redeemed on the web).
  const refresh = () => {
    setRefreshing(true);
    invalidateStoreEntitlement();
    setTimeout(() => setRefreshing(false), 700);
  };

  // The saved exam seeds the filter on a first run, and never overrules a learner who has since
  // chosen to look at something else — see `src/home/seedExamFilter.ts`, which is native-only
  // because `examFilter.ts` itself is file-synced from the web repo.
  //
  // In an effect, not in the render body: seeding during render notified the store's subscribers
  // mid-render, and `examFilter` above had already been read as null for that pass, so the counts
  // below were computed unfiltered and then flipped.
  useEffect(() => {
    if (profileReady) seedExamFilter(targetExam);
  }, [profileReady, targetExam]);

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
    if (!matchesExam(module.exams, examFilter)) continue;
    if (discipline) byDiscipline.set(discipline, (byDiscipline.get(discipline) ?? 0) + 1);
  }

  const hits = searching
    ? MODULES.filter(
        (module) =>
          module.status === 'available' && matchesExam(module.exams, examFilter) && matchesQuery(module, query),
      )
    : [];

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
      // Type to search, or ignore the box and keep scrolling: a drag dismisses the keyboard, and a
      // tap on a result lands on the first press instead of being spent closing the keyboard.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.brand} />}
    >
      <Stack.Screen options={{ title: 'Physiology', headerTitle: () => <Logo size={28} withName /> }} />

      {/* The day's one question, on the brand gradient, with the search box inside it. The study
          strip below rides up over its bottom edge when there is something to show. */}
      <GradientBox
        colors={[color.brandInk, color.brandDeep]}
        style={[styles.hero, totals.attempted > 0 && styles.heroUnderStrip]}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text accessibilityRole="header" style={[styles.heroTitle, { color: color.onBrandInk }]}>
              What shall we study today?
            </Text>
            <Text style={[styles.heroBody, { color: color.brandInkDim }]}>
              Interactive simulators for exam prep, from pre-med to resident.
            </Text>
          </View>
          <Illustration kind="welcome" size={84} />
        </View>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Try “cardiac output”, “ABG” or “shock”"
          accessibilityLabel="Search simulators"
        />
      </GradientBox>

      {totals.attempted > 0 && (
        <View style={styles.overlap}>
          <StudyStrip
            dueCount={totals.due}
            known={totals.known}
            totalQuestions={totals.totalQuestions}
            attempted={totals.attempted}
          />
        </View>
      )}

      <ExamFilterBar />

      {searching ? (
        hits.length === 0 ? (
          <View style={styles.empty}>
            <Illustration kind="search" size={96} />
            <Text accessibilityRole="header" style={[styles.emptyTitle, { color: color.text }]}>
              Nothing matches “{query.trim()}” yet
            </Text>
            <Text style={[styles.emptyBody, { color: color.textDim }]}>
              Try a shorter word, like “renal” or “heart”, or clear the search to browse by subject.
            </Text>
            <Button label="Clear search" variant="secondary" onPress={() => setQuery('')} />
          </View>
        ) : (
          hits.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              locked={!isUnlocked(module.id)}
              onPress={() => router.push(`/module/${module.id}`)}
              onPressLocked={() => router.push('/pricing')}
              {...(progress[module.id] ?? {})}
            />
          ))
        )
      ) : !profileReady ? (
        // Holds the subject list's shape while the saved exam loads, so the catalogue does not
        // flash unfiltered and then reorder.
        <View accessibilityLabel="Loading subjects" style={styles.skeletons}>
          <Skeleton height={96} style={{ borderRadius: RADIUS.lg }} />
          <Skeleton height={96} style={{ borderRadius: RADIUS.lg }} />
          <Skeleton height={96} style={{ borderRadius: RADIUS.lg }} />
        </View>
      ) : null}

      {!searching && profileReady && DISCIPLINES.map((discipline) => {
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

      {/* The round sits BELOW the subject grid, as on the web: picking what to study is the
          decision a learner arrives with, and the round is what they do once they have picked. */}
      <RoundBoard
        round={round}
        onOpenBed={(bed) => router.push(`/module/${bed.moduleId}?case=${bed.id}`)}
        onOpenPricing={() => router.push('/pricing')}
      />

      <StudyReport weakSpots={weakSpots} onOpenModule={(id) => router.push(`/module/${id}`)} />

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
        These are simplified, conceptual models built to teach mechanism, not clinical or
        diagnostic tools.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACE.xl, gap: SPACE.xl },
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    gap: SPACE.xl,
  },
  // Extra room at the bottom only when the study strip is going to ride up over it.
  heroUnderStrip: { paddingBottom: SPACE.xxxl + SPACE.xxl },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  heroText: { flex: 1, gap: SPACE.md },
  heroTitle: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: TRACKING_TIGHT, lineHeight: FONT.xl * LINE.tight },
  heroBody: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  // Rides up over the hero's bottom edge (its bottom padding plus the screen gap), so the two read
  // as one object.
  overlap: { marginTop: -(SPACE.xxxl + SPACE.xxl + SPACE.xl) + SPACE.lg, marginHorizontal: SPACE.md },
  skeletons: { gap: SPACE.lg },
  empty: { alignItems: 'center', gap: SPACE.lg, paddingVertical: SPACE.xxl },
  emptyTitle: { fontSize: FONT.lg, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose, textAlign: 'center' },
  tools: { gap: SPACE.md, marginTop: SPACE.md },
  toolsTitle: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  footnote: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.snug, marginTop: SPACE.md },
});
