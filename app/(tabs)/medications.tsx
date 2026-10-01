import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAMILIES, MEDICATIONS, type DrugClass, type FamilyMeta } from '../../src/medications/drugs';
import { MODULES } from '../../src/home/moduleRegistry';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';
import { Button } from '../../src/presentation/ui/Button';
import { Illustration } from '../../src/presentation/ui/Illustration';
import { SearchBar } from '../../src/presentation/ui/SearchBar';

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
          <Pressable accessibilityRole="link">
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

/** Every query word has to appear in the class name, a drug in it, or its mechanism. */
function matchesQuery(drugClass: DrugClass, query: string): boolean {
  const haystack = `${drugClass.className} ${drugClass.drugs.join(' ')} ${drugClass.mechanism}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function FamilySection({ family, query }: { family: FamilyMeta; query: string }) {
  const [opened, setOpened] = useState(false);
  const { color } = useAppTheme();
  // `DrugClass.family` is the display name; `FamilyMeta.id` is its URL slug. Matching on the id
  // silently found nothing and every family read "0 classes".
  const all = MEDICATIONS.filter((c) => c.family === family.name);
  const searching = query.trim() !== '';
  const classes = searching ? all.filter((c) => matchesQuery(c, query)) : all;
  // A search opens the families that have a hit, so the answer is on screen without a second tap;
  // and a family with no hit steps out of the way.
  if (searching && classes.length === 0) return null;
  const open = searching || opened;
  const setOpen = (update: (v: boolean) => boolean) => setOpened(update);
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
            {searching ? `${classes.length} of ${family.classCount}` : family.classCount}{' '}
            {family.classCount === 1 ? 'class' : 'classes'}
          </Text>
        </View>
        {!searching && <Text style={[styles.toggle, { color: color.brand }]}>{open ? 'Hide' : 'Open'}</Text>}
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
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const anyHit = !searching || MEDICATIONS.some((c) => matchesQuery(c, query));
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: color.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
      // Type to filter, or scroll the families as before; a drag dismisses the keyboard.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Stack.Screen options={{ title: 'Medications' }} />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Try “beta blocker” or “reduces preload”"
        accessibilityLabel="Search drug classes"
      />
      {/* On this screen, not only on Home: a drug list is exactly what somebody might glance at
          on a ward, and it describes mechanisms for learning, not doses or prescribing. */}
      <Text style={[styles.disclaimer, { color: color.textDim }]}>
        For learning pharmacology mechanisms only, not prescribing guidance. In practice, use the BNF,
        local guidelines and senior advice.
      </Text>
      {anyHit ? (
        FAMILIES.map((family) => <FamilySection key={family.id} family={family} query={query} />)
      ) : (
        <View style={styles.empty}>
          <Illustration kind="search" size={96} />
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: color.text }]}>
            No class matches “{query.trim()}”
          </Text>
          <Text style={[styles.emptyBody, { color: color.textDim }]}>
            Try the name of a drug, like “ramipril”, or a mechanism, like “ACE”.
          </Text>
          <Button label="Clear search" variant="secondary" onPress={() => setQuery('')} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.xl, gap: SPACE.lg },
  empty: { alignItems: 'center', gap: SPACE.lg, paddingVertical: SPACE.xxl },
  emptyTitle: { fontSize: FONT.lg, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACE.xl },
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
  disclaimer: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
});
