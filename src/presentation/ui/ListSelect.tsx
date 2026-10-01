import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, TAP, useAppTheme } from '../theme';
import type { ChipOption } from './ChipSelect';

interface ListSelectProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  disabled?: boolean;
}

/** One choice from a long list: a collapsed row showing the current answer that opens a scrolling list. */
export function ListSelect<T extends string>({ label, options, value, onChange, disabled }: ListSelectProps<T>) {
  const { color } = useAppTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '';

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: color.textDim }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => setOpen((was) => !was)}
        style={[styles.trigger, { opacity: disabled ? 0.5 : 1, borderColor: color.panelBorder, backgroundColor: color.panel }]}
      >
        <Text style={[styles.text, { color: color.text }]} numberOfLines={1}>
          {current}
        </Text>
        <Text style={{ color: color.textDim }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <ScrollView
          nestedScrollEnabled
          accessibilityRole="radiogroup"
          style={[styles.list, { borderColor: color.panelBorder, backgroundColor: color.panel }]}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value ?? 'none'}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={[styles.row, selected && { backgroundColor: color.select }]}
              >
                <Text style={[styles.text, { color: selected ? color.onSolid : color.text }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: SPACE.md },
  label: { fontSize: FONT.sm, fontWeight: '700' },
  trigger: {
    minHeight: TAP,
    paddingHorizontal: SPACE.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  list: { maxHeight: 280, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: TAP, paddingHorizontal: SPACE.xl, justifyContent: 'center' },
  text: { fontSize: FONT.base, fontWeight: '600', flexShrink: 1 },
});
