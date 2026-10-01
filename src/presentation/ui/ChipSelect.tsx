import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, TAP, useAppTheme } from '../theme';

export interface ChipOption<T extends string> {
  value: T | null;
  label: string;
}

interface ChipSelectProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  disabled?: boolean;
}

/** One choice from a short list, as chips. The same look as the onboarding exam step. */
export function ChipSelect<T extends string>({ label, options, value, onChange, disabled }: ChipSelectProps<T>) {
  const { color } = useAppTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.group}>
      <Text style={[styles.label, { color: color.textDim }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value ?? 'none'}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: !!disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  opacity: disabled ? 0.5 : 1,
                  borderColor: selected ? color.select : color.panelBorder,
                  backgroundColor: selected ? color.select : color.panel,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? color.onSolid : color.text }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: SPACE.md },
  label: { fontSize: FONT.sm, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md },
  chip: {
    minHeight: TAP,
    paddingHorizontal: SPACE.xl,
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: FONT.base, fontWeight: '600' },
});
