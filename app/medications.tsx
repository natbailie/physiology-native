import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { FAMILIES, MEDICATIONS, type DrugClass, type FamilyMeta } from '../src/medications/drugs';
import { MODULES } from '../src/home/moduleRegistry';

/**
 * The pharmacology hub: the UK top-100 drug classes, by family.
 *
 * The web reaches a class through nested routes (`#medications/<family>/<class>`, with two extra
 * tiers under Infection). On a phone that is a lot of drilling for a list this size, so the
 * families expand in place instead — the same hierarchy, one screen. Every class that names a
 * `moduleId` links to the simulator that models what it acts on, which is the whole point of
 * keeping the formulary next to the engines.
 */
function ClassRow({ drugClass, isDark }: { drugClass: DrugClass; isDark: boolean }) {
  const target = drugClass.moduleId ? MODULES.find((m) => m.id === drugClass.moduleId) : undefined;
  return (
    <View style={[styles.classCard, isDark && styles.classCardDark]}>
      <Text style={[styles.className, isDark && styles.textLight]}>{drugClass.className}</Text>
      <Text style={[styles.drugs, isDark && styles.bodyDark]}>{drugClass.drugs.join(' · ')}</Text>
      <Text style={[styles.mechanism, isDark && styles.bodyDark]}>{drugClass.mechanism}</Text>
      {target && (
        <Link href={`/module/${target.id}`} asChild>
          <Pressable style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={styles.linkText}>See it act in {target.name}</Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

function FamilySection({ family, isDark }: { family: FamilyMeta; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const classes = MEDICATIONS.filter((c) => c.family === family.id);
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.familyName, isDark && styles.textLight]}>{family.name}</Text>
          <Text style={[styles.count, isDark && styles.bodyDark]}>
            {classes.length} {classes.length === 1 ? 'class' : 'classes'}
          </Text>
        </View>
        <Text style={styles.toggle}>{open ? 'Hide' : 'Open'}</Text>
      </Pressable>
      {open && (
        <View style={styles.classes}>
          {classes.map((c) => (
            <ClassRow key={c.id} drugClass={c} isDark={isDark} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function MedicationsScreen() {
  const isDark = useColorScheme() === 'dark';
  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Medications' }} />
      {FAMILIES.map((family) => (
        <FamilySection key={family.id} family={family} isDark={isDark} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 10 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14 },
  cardDark: { backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1 },
  familyName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  count: { fontSize: 13, color: '#64748b', marginTop: 2 },
  toggle: { fontSize: 14, fontWeight: '600', color: '#4f46e5' },
  classes: { marginTop: 12, gap: 10 },
  classCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, gap: 6 },
  classCardDark: { backgroundColor: '#0f172a' },
  className: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  drugs: { fontSize: 12, color: '#64748b' },
  mechanism: { fontSize: 13, lineHeight: 20, color: '#475569' },
  bodyDark: { color: '#94a3b8' },
  textLight: { color: '#e2e8f0' },
  link: { paddingTop: 2 },
  linkText: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  pressed: { opacity: 0.6 },
});
