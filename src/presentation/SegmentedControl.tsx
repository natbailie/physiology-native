/**
 * An iOS segmented control.
 *
 * Three callers, and they are the reason it exists rather than being inlined three times: the
 * theme toggle (light / dark / system, mirroring the web's three-state ThemeToggle) and the
 * module screen's lab / patients / questions / lessons split.
 *
 * Sized to `TAP` throughout. The web has no touch-target floor, so this is one of the places
 * where mirroring it exactly would have produced a worse app rather than a matching one.
 *
 * Four-up at 375pt gives each segment ~75pt of text width once the track chrome is off, and
 * "Questions" at 13pt semibold does not fit it — so a four-segment strip steps its labels
 * down to micro, which does with room to spare. Three segments keep the larger size.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, TAP, useAppTheme } from './theme';
import { selectionTick } from './haptics';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Colours the selected segment. Defaults to the house brand; module screens pass their accent. */
  accent?: string;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accent,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { color } = useAppTheme();
  const selectedBg = accent ?? color.brand;
  const compact = segments.length > 3;

  return (
    <View
      style={[styles.track, { backgroundColor: color.panelRaised, borderColor: color.panelBorder }]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => {
              if (selected) return;
              selectionTick();
              onChange(segment.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: selectedBg },
              pressed && !selected && styles.pressed,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, compact && styles.labelCompact, { color: selected ? color.onSolid : color.textDim }]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: TAP - 8,
    borderRadius: RADIUS.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pressed: { opacity: 0.5 },
  label: { fontSize: FONT.xs, fontWeight: '600' },
  labelCompact: { fontSize: FONT.micro },
});
