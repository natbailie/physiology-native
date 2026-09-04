import { Link, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FORMULAS, type FormulaDefinition } from '../../src/reference/formulas';
import { MODULES } from '../../src/home/moduleRegistry';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';

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

      {formula.inputs.map((field) => (
        <View key={field.key} style={styles.fieldRow}>
          <Text style={[styles.fieldLabel, { color: color.textDim }]}>
            {field.label}
            {field.unit ? ` (${field.unit})` : ''}
          </Text>
          <TextInput
            value={String(values[field.key] ?? '')}
            onChangeText={(text) => {
              const n = Number(text);
              setValues((prev) => ({ ...prev, [field.key]: Number.isFinite(n) ? n : 0 }));
            }}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
          />
        </View>
      ))}

      <View style={[styles.resultRow, { borderTopColor: color.panelBorder }]}>
        <Text style={[styles.resultLabel, { color: color.textDim }]}>{formula.resultLabel}</Text>
        <Text style={[styles.resultValue, { color: color.text }]}>
          {result === null ? '—' : result.toFixed(2)}
          <Text style={[styles.resultUnit, { color: color.textFaint }]}> {formula.resultUnit}</Text>
        </Text>
      </View>

      <Text style={[styles.explanation, { color: color.textDim }]}>{formula.explanation}</Text>

      {target && (
        <Link href={`/module/${target.id}`} asChild>
          <Pressable>
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
  const domains = useMemo(() => [...new Set(FORMULAS.map((f) => f.domain))], []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: color.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Stack.Screen options={{ title: 'Formula Reference' }} />
      {domains.map((domain) => (
        <View key={domain} style={styles.domain}>
          <Text style={[styles.domainTitle, { color: color.text }]}>{domain}</Text>
          {FORMULAS.filter((f) => f.domain === domain).map((f) => (
            <FormulaCard key={f.id} formula={f} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.xl, gap: SPACE.xxl },
  domain: { gap: SPACE.md },
  domainTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  card: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.xl, gap: SPACE.md },
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
    borderTopWidth: 1,
    paddingTop: SPACE.md,
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
