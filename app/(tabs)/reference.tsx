import { Link, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FORMULAS, type FormulaDefinition } from '../../src/reference/formulas';
import { MODULES } from '../../src/home/moduleRegistry';
import { KeyboardAwareScroll } from '../../src/presentation/KeyboardAwareScroll';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';
import { Button } from '../../src/presentation/ui/Button';
import { GradientBox } from '../../src/presentation/ui/GradientBox';
import { Illustration } from '../../src/presentation/ui/Illustration';
import { SearchBar } from '../../src/presentation/ui/SearchBar';

/**
 * The formula sheet, as live calculators.
 *
 * Both the definitions and the arithmetic are file-synced from the web project, so a formula
 * only ever exists in one place. Each card links to the module that simulates it where one
 * does — a calculator tells a learner what a number is, and the simulator shows what moves it.
 */
function FormulaCard({ formula }: { formula: FormulaDefinition }) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(formula.inputs.map((f) => [f.key, f.default])),
  );

  // What is typed, kept as text: converting each keystroke made "1." or "-" collapse to 0 mid-edit.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const result = useMemo(() => {
    try {
      const n = formula.compute(values);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }, [formula, values]);

  const target = formula.moduleId ? MODULES.find((m) => m.id === formula.moduleId) : undefined;
  const { color } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Text style={[styles.name, { color: color.text }]}>{formula.name}</Text>
      <Text style={[styles.formula, { color: color.textDim }]}>{formula.formulaDisplay}</Text>

      {formula.inputs.map((field) => {
        // A half-typed "-" or "." is normal mid-edit and is not shouted at; something that can never
        // become a number is, beside the field it is in.
        const draft = drafts[field.key];
        const invalid = draft !== undefined && draft.trim() !== '' && !Number.isFinite(Number(draft.replace(',', '.'))) && !/^[-.,]+$/.test(draft.trim());
        return (
        <View key={field.key} style={styles.fieldWrap}>
        <View style={styles.fieldRow}>
          <Text style={[styles.fieldLabel, { color: color.textDim }]}>
            {field.label}
            {field.unit ? ` (${field.unit})` : ''}
          </Text>
          <TextInput
            value={drafts[field.key] ?? String(values[field.key] ?? '')}
            onChangeText={(text) => {
              setDrafts((prev) => ({ ...prev, [field.key]: text }));
              const n = Number(text.replace(',', '.'));
              // An empty or half-typed value ("-", ".") leaves the last good number in place.
              if (text.trim() !== '' && Number.isFinite(n)) setValues((prev) => ({ ...prev, [field.key]: n }));
            }}
            onBlur={() =>
              setDrafts((prev) => {
                const { [field.key]: _typed, ...rest } = prev;
                return rest;
              })
            }
            keyboardType="decimal-pad"
            selectTextOnFocus
            accessibilityLabel={field.label}
            style={[styles.input, { borderColor: invalid ? color.danger : color.panelBorder, color: color.text }]}
          />
        </View>
        {invalid && (
          <Text accessibilityLiveRegion="polite" style={[styles.fieldError, { color: color.danger }]}>
            That is not a number. Try something like 72 or 1.5, and the answer below will keep the last good value.
          </Text>
        )}
        </View>
        );
      })}

      <GradientBox colors={[color.brandInk, color.brandDeep]} direction="horizontal" style={styles.resultRow}>
        <Text style={[styles.resultLabel, { color: color.brandInkDim }]}>{formula.resultLabel}</Text>
        <Text style={[styles.resultValue, { color: color.onBrandInk }]}>
          {result === null ? '—' : result.toFixed(2)}
          <Text style={[styles.resultUnit, { color: color.brandInkDim }]}> {formula.resultUnit}</Text>
        </Text>
      </GradientBox>

      <Text style={[styles.explanation, { color: color.textDim }]}>{formula.explanation}</Text>

      {target && (
        <Link href={`/module/${target.id}`} asChild>
          <Pressable accessibilityRole="link">
            {({ pressed }) => (
              <View style={[styles.link, pressed && styles.pressed]}>
                <Text style={[styles.linkText, { color: color.brand }]}>
                  Watch it move in {target.name}
                </Text>
              </View>
            )}
          </Pressable>
        </Link>
      )}
    </View>
  );
}

export default function ReferenceScreen() {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (f: FormulaDefinition) => {
    const haystack = `${f.name} ${f.domain} ${f.formulaDisplay}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  };
  const anyHit = FORMULAS.some(matches);
  const domains = useMemo(
    () => [...new Set(FORMULAS.filter(matches).map((f) => f.domain))],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `matches` is derived from `query`
    [query],
  );

  return (
    /* Dozens of numeric fields down a long scroll, and a `decimal-pad` has no return key: before
       this, the only way off a field was to drag, and the RESULT row sits below the inputs, so
       the answer you were typing towards was hidden too. */
    <KeyboardAwareScroll
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={[styles.container, { backgroundColor: color.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: 'Formula Reference' }} />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Try “MAP”, “anion gap” or “cardiac output”"
        accessibilityLabel="Search formulas"
      />
      <Text style={[styles.disclaimer, { color: color.textDim }]}>
        For learning and exam revision, not for calculating doses or making clinical decisions.
      </Text>
      {!anyHit && (
        <View style={styles.empty}>
          <Illustration kind="search" size={96} />
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: color.text }]}>
            No formula matches “{query.trim()}”
          </Text>
          <Text style={[styles.emptyBody, { color: color.textDim }]}>
            Try a shorter word, or clear the search to see every formula.
          </Text>
          <Button label="Clear search" variant="secondary" onPress={() => setQuery('')} />
        </View>
      )}
      {domains.map((domain) => (
        <View key={domain} style={styles.domain}>
          <Text accessibilityRole="header" style={[styles.domainTitle, { color: color.text }]}>
            {domain}
          </Text>
          {FORMULAS.filter((f) => f.domain === domain && matches(f)).map((f) => (
            <FormulaCard key={f.id} formula={f} />
          ))}
        </View>
      ))}
    </KeyboardAwareScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.xl, gap: SPACE.xl },
  domain: { gap: SPACE.md },
  domainTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  disclaimer: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  card: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACE.xl, gap: SPACE.lg },
  fieldWrap: { gap: SPACE.sm },
  fieldError: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.snug },
  empty: { alignItems: 'center', gap: SPACE.lg, paddingVertical: SPACE.xxl },
  emptyTitle: { fontSize: FONT.lg, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose, textAlign: 'center' },
  name: { fontSize: FONT.base, fontWeight: '700' },
  formula: { fontSize: FONT.xs, fontFamily: 'Menlo' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.lg },
  fieldLabel: { fontSize: FONT.xs, flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.lg,
    minHeight: TAP,
    minWidth: 96,
    textAlign: 'right',
    fontSize: FONT.base,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.lg,
    marginTop: 2,
  },
  resultLabel: { fontSize: FONT.xs },
  resultValue: { fontSize: FONT.xl, fontWeight: '700', fontVariant: ['tabular-nums'] },
  resultUnit: { fontSize: FONT.xs, fontWeight: '400' },
  explanation: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  link: { minHeight: TAP, justifyContent: 'center' },
  linkText: { fontSize: FONT.xs, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
