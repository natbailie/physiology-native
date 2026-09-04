import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAMILIES, MEDICATIONS, type DrugClass, type FamilyMeta } from '../../src/medications/drugs';
import { MODULES } from '../../src/home/moduleRegistry';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';

/**
 * The pharmacology hub: the UK top-100 drug classes, by family.
 *
 * The web reaches a class through nested routes (`#medications/<family>/<class>`, with two extra
 * tiers under Infection). On a phone that is a lot of drilling for a list this size, so the
 * families expand in place instead — the same hierarchy, one screen. Every class that names a
 * `moduleId` links to the simulator that models what it acts on, which is the whole point of
 * keeping the formulary next to the engines.
 */
function ClassRow({ drugClass }: { drugClass: DrugClass }) {
  const target = drugClass.moduleId ? MODULES.find((m) => m.id === drugClass.moduleId) : undefined;
  const { color } = useAppTheme();
  return (
    <View style={[styles.classCard, { backgroundColor: color.panelRaised, borderColor: color.panelBorder }]}>
      <Text style={[styles.className, { color: color.text }]}>{drugClass.className}</Text>
      <Text style={[styles.drugs, { color: color.textFaint }]}>{drugClass.drugs.join(' · ')}</Text>
      <Text style={[styles.mechanism, { color: color.textDim }]}>{drugClass.mechanism}</Text>
      {target && (
        <Link href={`/module/${target.id}`} asChild>
          <Pressable>
            {({ pressed }) => (
              <View style={[styles.link, pressed && styles.pressed]}>
                <Text style={[styles.linkText, { color: color.brand }]}>
                  See it act in {target.name}
                </Text>
              </View>
            )}
          </Pressable>
        </Link>
      )}
    </View>
  );
}

function FamilySection({ family }: { family: FamilyMeta }) {
  const [open, setOpen] = useState(false);
  const { color } = useAppTheme();
  // `DrugClass.family` is the display name; `FamilyMeta.id` is its URL slug. Matching on the id
  // silently found nothing and every family read "0 classes".
  const classes = MEDICATIONS.filter((c) => c.family === family.name);
  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={[styles.familyName, { color: color.text }]}>{family.name}</Text>
          <Text style={[styles.blurb, { color: color.textDim }]}>{family.blurb}</Text>
          <Text style={[styles.count, { color: color.textFaint }]}>
            {family.classCount} {family.classCount === 1 ? 'class' : 'classes'}
          </Text>
        </View>
        <Text style={[styles.toggle, { color: color.brand }]}>{open ? 'Hide' : 'Open'}</Text>
      </Pressable>
      {open && (
        <View style={styles.classes}>
          {classes.map((c) => (
            <ClassRow key={c.id} drugClass={c} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function MedicationsScreen() {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: color.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: 'Medications' }} />
      {FAMILIES.map((family) => (
        <FamilySection key={family.id} family={family} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.xl, gap: SPACE.md },
  card: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.lg,
    minHeight: TAP,
  },
  headerText: { flex: 1 },
  familyName: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  blurb: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.snug, marginTop: SPACE.xs },
  count: { fontSize: FONT.micro, marginTop: SPACE.xs },
  toggle: { fontSize: FONT.sm, fontWeight: '700' },
  classes: { marginTop: SPACE.lg, gap: SPACE.md },
  classCard: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.lg, gap: SPACE.sm },
  className: { fontSize: FONT.sm, fontWeight: '700' },
  drugs: { fontSize: FONT.micro },
  mechanism: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  link: { minHeight: TAP, justifyContent: 'center' },
  linkText: { fontSize: FONT.xs, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
