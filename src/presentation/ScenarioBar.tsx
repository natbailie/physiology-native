import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

interface ActionButton {
  label: string;
  onPress: () => void;
  /** The web PresetBar renders primary preset application and impulse actions (Eat meal /
   * Give insulin). Keep an optional variant for visual distinction. */
  variant?: 'impulse' | 'primary';
}

export interface PresetOption {
  id: string;
  label: string;
}

interface ScenarioBarProps {
  presets: PresetOption[];
  activePreset: string | null;
  onApplyPreset: (id: string) => void;
  actions: ActionButton[];
}

/**
 * Native mirror of the web PresetBar: the scenario chips at the top (Normal meal response,
 * Type 1 diabetes, ...) and the impulse actions beneath (Eat meal, Give insulin). A preset
 * rebuilds the inputs from the module defaults and resets the engine, exactly like the web's
 * `useScenarioPreset` — it never stacks on the current sliders.
 */
export function ScenarioBar({ presets, activePreset, onApplyPreset, actions }: ScenarioBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
        {presets.map((preset) => {
          const selected = preset.id === activePreset;
          return (
            <Pressable
              key={preset.id}
              onPress={() => onApplyPreset(preset.id)}
              style={[styles.chip, selected && styles.chipSelected, isDark && styles.chipDark, selected && isDark && styles.chipSelectedDark]}
            >
              <Text style={[styles.chipText, isDark && styles.chipTextDark, selected && styles.chipTextSelected]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.actionRow}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={[styles.actionBtn, action.variant === 'impulse' && styles.actionImpulse, isDark && styles.actionBtnDark]}
          >
            <Text style={[styles.actionText, action.variant === 'impulse' && styles.actionTextImpulse, isDark && styles.actionTextDark]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  presetRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  chipSelected: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  chipSelectedDark: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  chipTextDark: { color: '#cbd5e1' },
  chipTextSelected: { color: '#ffffff' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#22c55e',
  },
  actionBtnDark: { backgroundColor: '#16a34a' },
  actionImpulse: { backgroundColor: '#3b82f6' },
  actionText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  actionTextImpulse: { color: '#ffffff' },
  actionTextDark: { color: '#ffffff' },
});
