import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { selectionTick } from './haptics';

interface ActionButton {
  label: string;
  onPress: () => void;
  /**
   * How the button reads, matching the web's `PresetBar`.
   *
   * 'impulse' is a one-off given TO the patient (Eat meal, Give insulin, Transfuse); 'danger' is an
   * insult applied to them (Haemorrhage, Acute bleed, Stand up). The phone had no 'danger', so a
   * bleed and a bolus were the same button in the same colour — the one distinction the variant
   * exists to draw. Both are drawn as a wash rather than a solid, so the label keeps its own signal
   * colour instead of needing `onSolid`.
   */
  variant?: 'impulse' | 'danger' | 'primary';
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
  /** The module's colour. Every module used to render this bar in the same green and blue,
   *  regardless of its own accent, which made the top of all 45 screens identical. */
  accent: string;
  /** Locks every chip while a pattern question is open. Loading a different scenario
   * mid-question would silently replace the one being asked about. */
  disabled?: boolean;
}

/**
 * Native mirror of the web PresetBar: the scenario chips at the top (Normal meal response,
 * Type 1 diabetes, ...) and the impulse actions beneath (Eat meal, Give insulin). A preset
 * rebuilds the inputs from the module defaults and resets the engine, exactly like the web's
 * `useScenarioPreset` — it never stacks on the current sliders.
 *
 * Both rows take the module accent and a selection tick. An impulse is outlined rather than
 * filled: on a screen where the filled control means "this is the scenario you are in", a second
 * filled control that means "do this once" is the same emphasis for a different kind of thing.
 */
export function ScenarioBar({ presets, activePreset, onApplyPreset, actions, accent, disabled = false }: ScenarioBarProps) {
  const { color } = useAppTheme();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
        {presets.map((preset) => {
          const selected = preset.id === activePreset;
          return (
            <Pressable
              key={preset.id}
              onPress={() => {
                selectionTick();
                onApplyPreset(preset.id);
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? accent : color.panel,
                  borderColor: selected ? accent : color.panelBorder,
                },
                pressed && !disabled && styles.pressed,
                disabled && styles.locked,
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? color.onSolid : color.textDim }]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {actions.length > 0 && (
        <View style={styles.actionRow}>
          {actions.map((action) => {
            const impulse = action.variant === 'impulse';
            const danger = action.variant === 'danger';
            const washed = impulse || danger;
            const tint = danger ? color.danger : accent;
            return (
              <Pressable
                key={action.label}
                onPress={() => {
                  selectionTick();
                  action.onPress();
                }}
                disabled={disabled}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.actionBtn,
                  washed
                    ? { backgroundColor: withAlpha(tint, 0.12), borderColor: tint }
                    : { backgroundColor: accent, borderColor: accent },
                  pressed && !disabled && styles.pressed,
                  disabled && styles.locked,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.actionText, { color: washed ? tint : color.onSolid }]}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.lg },
  presetRow: { gap: SPACE.md, paddingVertical: 2 },
  chip: {
    minHeight: TAP - 8,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: FONT.xs, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: SPACE.md },
  actionBtn: {
    flex: 1,
    minHeight: TAP,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  actionText: { fontSize: FONT.sm, fontWeight: '700' },
  pressed: { opacity: 0.6 },
  locked: { opacity: 0.4 },
});
