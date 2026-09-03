import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { MODULES, type ModuleDescriptor } from '../src/home/moduleRegistry';
import { useModuleProgress, type ModuleProgress, type ProgressTotals } from '../src/home/useModuleProgress';
import { useProgressStore } from '../src/shared/assessment/useProgressStore';
import { lookupColor } from '../src/presentation/palette';

/**
 * The modules this app can open, from the file-synced catalogue rather than a second copy.
 *
 * `moduleRegistry.ts` is the web project's single source of truth for the catalogue, and this
 * screen used to restate 45 of its entries — id, name, tagline and an accent colour — by hand.
 * Nothing checked the two against each other, so a tagline reworded upstream stayed stale here.
 *
 * `theme` is the simulator predicate: the descriptor documents it as absent only on the
 * non-simulator utility pages, which is exactly the formula sheet and the pharmacology hub, and
 * neither has a screen here yet.
 */
const SIMULATORS = MODULES.filter((m) => m.theme !== undefined && m.status === 'available');

/** `accentColorVar` is a CSS reference — `var(--artery)`. Native wants the token inside it. */
function accentOf(module: ModuleDescriptor, isDark: boolean): string | undefined {
  const token = module.accentColorVar?.match(/^var\(--([a-z0-9-]+)\)$/)?.[1];
  return lookupColor(token, isDark ? 'dark' : 'light');
}

/**
 * The web's study strip: what is due, what is known, and how long the streak is.
 *
 * Everything here is read through the file-synced useModuleProgress, which is also what builds
 * the question index — so this is the first screen to exercise manifest.generated.ts and the
 * on-device progress store.
 */
/** The two non-simulator pages, which the registry marks by having no `theme`. */
function UtilityLinks({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.utilityRow}>
      {[
        { href: '/reference', label: 'Formula Reference' },
        { href: '/medications', label: 'Medications' },
        { href: '/account', label: 'Account' },
      ].map((item) => (
        <Link key={item.href} href={item.href} asChild>
          <Pressable>
            {({ pressed }) => (
              <View style={[styles.utility, isDark && styles.utilityDark, pressed && styles.cardPressed]}>
                <Text style={[styles.utilityText, isDark && styles.textLight]}>{item.label}</Text>
              </View>
            )}
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

function StudyStrip({ totals, streak, isDark }: { totals: ProgressTotals; streak: number; isDark: boolean }) {
  const parts = [
    totals.due > 0 ? `${totals.due} due` : null,
    totals.totalQuestions > 0 ? `${totals.known} / ${totals.totalQuestions} known` : null,
    streak > 0 ? `${streak}-day streak` : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <View style={[styles.strip, isDark && styles.stripDark]}>
      <Text style={[styles.stripText, isDark && styles.textMuted]}>{parts.join('  ·  ')}</Text>
    </View>
  );
}

function ModuleCard({
  module: m,
  isDark,
  progress,
}: {
  module: ModuleDescriptor;
  isDark: boolean;
  progress?: ModuleProgress;
}) {
  const accent = accentOf(m, isDark);
  return (
    <Link href={`/module/${m.id}`} asChild>
      <Pressable>
        {({ pressed }) => (
          <View style={[styles.card, isDark && styles.cardDark, pressed && styles.cardPressed]}>
            {accent && <View style={[styles.accent, { backgroundColor: accent }]} />}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, isDark && styles.textLight]}>{m.name}</Text>
              <Text style={[styles.cardTagline, isDark && styles.textMuted]}>{m.tagline}</Text>
              {progress && progress.dueCount > 0 && (
                <Text style={[styles.cardDue, { color: accent ?? '#64748b' }]}>
                  {progress.dueCount} due for review
                </Text>
              )}
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { progress, totals } = useModuleProgress();
  const store = useProgressStore();
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen options={{ title: 'Physiology' }} />
      <FlatList
        data={SIMULATORS}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <StudyStrip totals={totals} streak={store.streak()} isDark={isDark} />
            <UtilityLinks isDark={isDark} />
          </>
        }
        renderItem={({ item }) => (
          <ModuleCard module={item} isDark={isDark} progress={progress[item.id]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardDark: { backgroundColor: '#1e293b' },
  cardPressed: { opacity: 0.7 },
  accent: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  cardTagline: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  cardDue: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  utilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  utility: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  utilityDark: { backgroundColor: '#1e293b' },
  utilityText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  strip: { paddingVertical: 10, paddingHorizontal: 4, marginBottom: 4 },
  stripDark: {},
  stripText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  textLight: { color: '#e2e8f0' },
  textMuted: { color: '#94a3b8' },
});
