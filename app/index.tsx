import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

interface ModuleEntry {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
}

const MODULES: ModuleEntry[] = [
  {
    id: 'glucoseRegulation',
    name: 'Glucose Regulation',
    tagline: 'Insulin, glucagon & counter-regulatory hormones',
    accentColor: '#22c55e',
  },
  {
    id: 'cardiorenal',
    name: 'Cardiorenal',
    tagline: 'Heart & kidney feedback simulator',
    accentColor: '#ef4444',
  },
  {
    id: 'respiratory',
    name: 'Respiratory & Acid-Base',
    tagline: 'Ventilation, gas exchange & reading a blood gas',
    accentColor: '#3b82f6',
  },
];

function ModuleCard({ module: m, isDark }: { module: ModuleEntry; isDark: boolean }) {
  return (
    <Link href={`/module/${m.id}`} asChild>
      <Pressable>
        {({ pressed }) => (
          <View style={[styles.card, isDark && styles.cardDark, pressed && styles.cardPressed]}>
            <View style={[styles.accent, { backgroundColor: m.accentColor }]} />
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
      <FlatList
        data={MODULES}
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
