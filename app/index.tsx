import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { MODULES, type ModuleDescriptor } from '../src/home/moduleRegistry';
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

function ModuleCard({ module: m, isDark }: { module: ModuleDescriptor; isDark: boolean }) {
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
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen options={{ title: 'Physiology' }} />
      <FlatList
        data={SIMULATORS}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ModuleCard module={item} isDark={isDark} />}
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
  textLight: { color: '#e2e8f0' },
  textMuted: { color: '#94a3b8' },
});
