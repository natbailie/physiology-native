import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { selectionTick } from './haptics';

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
  /** The module's colour. Every module used to render this bar in the same green and blue,
   *  regardless of its own accent, which made the top of all 45 screens identical. */
  accent: string;
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
export function ScenarioBar({ presets, activePreset, onApplyPreset, actions, accent }: ScenarioBarProps) {
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
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? accent : color.panel,
                  borderColor: selected ? accent : color.panelBorder,
                },
                pressed && styles.pressed,
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
            return (
              <Pressable
                key={action.label}
                onPress={() => {
                  selectionTick();
                  action.onPress();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.actionBtn,
                  impulse
                    ? { backgroundColor: withAlpha(accent, 0.12), borderColor: accent }
                    : { backgroundColor: accent, borderColor: accent },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.actionText, { color: impulse ? accent : color.onSolid }]}
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
});
