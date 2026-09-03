import { Link, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { FORMULAS, type FormulaDefinition } from '../src/reference/formulas';
import { MODULES } from '../src/home/moduleRegistry';

/**
 * The formula sheet, as live calculators.
 *
 * Both the definitions and the arithmetic are file-synced from the web project, so a formula
 * only ever exists in one place. Each card links to the module that simulates it where one
 * does — a calculator tells a learner what a number is, and the simulator shows what moves it.
 */
function FormulaCard({ formula, isDark }: { formula: FormulaDefinition; isDark: boolean }) {
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

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Text style={[styles.name, isDark && styles.textLight]}>{formula.name}</Text>
      <Text style={[styles.formula, isDark && styles.formulaDark]}>{formula.formulaDisplay}</Text>

      {formula.inputs.map((field) => (
        <View key={field.key} style={styles.fieldRow}>
          <Text style={[styles.fieldLabel, isDark && styles.bodyDark]}>
            {field.label}
            {field.unit ? ` (${field.unit})` : ''}
          </Text>
          <TextInput
            value={String(values[field.key] ?? '')}
            onChangeText={(text) => {
              const n = Number(text);
              setValues((prev) => ({ ...prev, [field.key]: Number.isFinite(n) ? n : 0 }));
            }}
            keyboardType="numeric"
            style={[styles.input, isDark && styles.inputDark]}
          />
        </View>
      ))}

      <View style={styles.resultRow}>
        <Text style={[styles.resultLabel, isDark && styles.bodyDark]}>{formula.resultLabel}</Text>
        <Text style={[styles.resultValue, isDark && styles.textLight]}>
          {result === null ? '—' : result.toFixed(2)}
          <Text style={styles.resultUnit}> {formula.resultUnit}</Text>
        </Text>
      </View>

      <Text style={[styles.explanation, isDark && styles.bodyDark]}>{formula.explanation}</Text>

      {target && (
        <Link href={`/module/${target.id}`} asChild>
          <Pressable>
            {({ pressed }) => (
              <View style={[styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Watch it move in {target.name}</Text>
              </View>
            )}
          </Pressable>
        </Link>
      )}
    </View>
  );
}

export default function ReferenceScreen() {
  const isDark = useColorScheme() === 'dark';
  const domains = useMemo(() => [...new Set(FORMULAS.map((f) => f.domain))], []);

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Formula Reference' }} />
      {domains.map((domain) => (
        <View key={domain} style={styles.domain}>
          <Text style={[styles.domainTitle, isDark && styles.textLight]}>{domain}</Text>
          {FORMULAS.filter((f) => f.domain === domain).map((f) => (
            <FormulaCard key={f.id} formula={f} isDark={isDark} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 20 },
  domain: { gap: 10 },
  domainTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, gap: 8 },
  cardDark: { backgroundColor: '#1e293b' },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  formula: { fontSize: 13, color: '#475569', fontFamily: 'Menlo' },
  formulaDark: { color: '#cbd5e1' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  fieldLabel: { fontSize: 13, color: '#475569', flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 90,
    textAlign: 'right',
    fontSize: 14,
    color: '#0f172a',
  },
  inputDark: { borderColor: '#334155', color: '#e2e8f0' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 2,
  },
  resultLabel: { fontSize: 13, color: '#475569' },
  resultValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  resultUnit: { fontSize: 13, fontWeight: '400', color: '#94a3b8' },
  explanation: { fontSize: 13, lineHeight: 20, color: '#475569' },
  bodyDark: { color: '#cbd5e1' },
  textLight: { color: '#e2e8f0' },
  link: { paddingVertical: 6 },
  linkText: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  pressed: { opacity: 0.6 },
});
