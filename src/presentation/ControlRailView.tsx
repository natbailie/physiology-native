import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import type { ControlSpec } from './types';
import { lookupColor } from './palette';
import { FONT, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { selectionTick } from './haptics';

/* ------------------------------------------------------------------ */
/*  Slider                                                             */
/* ------------------------------------------------------------------ */

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: 'decimal' | 'percent';
  onChange: (value: number) => void;
  /** The module's accent, so the filled part of the track reads as the module's colour. */
  accent: string;
}

/**
 * A real slider, with the +/- as fine adjustment either side of it.
 *
 * These were steppers alone, which is a lot of taps: `blood volume` spans 3000-7000 mL in steps
 * of 50, so reaching an extreme took eighty presses. The web has had a drag control throughout,
 * and a control a learner will not sweep is a feedback loop they will not see.
 *
 * The +/- are Pressables rather than `<Text onPress>` so they take hit-slop and show a pressed
 * state; at 24pt the text glyphs alone were below the accessible touch target.
 */
function SliderControl({ label, value, min, max, step, unit, format, onChange, accent }: SliderProps) {
  const { color } = useAppTheme();
  const decrement = () => {
    if (value <= min) return;
    selectionTick();
    onChange(Math.max(min, +(value - step).toFixed(6)));
  };
  const increment = () => {
    if (value >= max) return;
    selectionTick();
    onChange(Math.min(max, +(value + step).toFixed(6)));
  };

  const displayValue = format === 'percent'
    ? `${Math.round(value * 100)}%`
    : step < 1
      ? value.toFixed(step < 0.1 ? 2 : 1)
      : Math.round(value).toString();

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: color.text }]} numberOfLines={2}>
          {label}
        </Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={decrement}
            disabled={value <= min}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label}`}
            style={({ pressed }) => [
              styles.stepperBtnBox,
              { backgroundColor: withAlpha(accent, 0.12) },
              value <= min && styles.stepperDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.stepperBtn, { color: accent }]}>−</Text>
          </Pressable>
          <Text style={[styles.sliderValue, { color: color.text }]}>
            {displayValue}{unit ? ` ${unit}` : ''}
          </Text>
          <Pressable
            onPress={increment}
            disabled={value >= max}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label}`}
            style={({ pressed }) => [
              styles.stepperBtnBox,
              { backgroundColor: withAlpha(accent, 0.12) },
              value >= max && styles.stepperDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.stepperBtn, { color: accent }]}>+</Text>
          </Pressable>
        </View>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={accent}
        maximumTrackTintColor={color.panelBorder}
        thumbTintColor={accent}
        accessibilityLabel={label}
        // The track is 4pt tall and the thumb is drawn to it. Giving the control real height
        // makes the whole strip draggable rather than only the thumb itself.
        style={styles.slider}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle group                                                       */
/* ------------------------------------------------------------------ */

interface ToggleGroupProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  accent: string;
}

function ToggleGroup({ label, value, options, onChange, accent }: ToggleGroupProps) {
  const { color } = useAppTheme();
  return (
    <View style={[styles.toggleContainer, { borderBottomColor: color.panelBorder }]}>
      <Text style={[styles.sliderLabel, { color: color.text }]}>{label}</Text>
      <View style={styles.toggleRow}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            // Was a bare <Text onPress>, which is not a touch target: no pressed state, no
            // accessibility role, and a hit area the height of one line of 13pt text.
            <Pressable
              key={opt.value}
              onPress={() => {
                if (selected) return;
                selectionTick();
                onChange(opt.value);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.toggleOption,
                {
                  backgroundColor: selected ? accent : color.panelRaised,
                  borderColor: selected ? accent : color.panelBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.toggleOptionText, { color: selected ? color.onSolid : color.textDim }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Control rail                                                       */
/* ------------------------------------------------------------------ */

interface ControlRailViewProps<Inputs> {
  controls: readonly ControlSpec<Inputs>[];
  inputs?: Inputs;
  onChange?: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;
  /** The module's accent colour, for the filled part of each slider track. */
  accent?: string;
}

export function ControlRailView<Inputs>({
  controls,
  inputs,
  onChange,
  accent,
}: ControlRailViewProps<Inputs>) {
  return (
    <View style={styles.rail}>
      {controls.map((spec) => {
        if (spec.kind === 'toggle') {
          const value = inputs ? String(inputs[spec.key]) : spec.options[0]?.value ?? '';
          return (
            <ToggleGroup
              key={String(spec.key)}
              label={spec.label}
              value={value}
              options={[...spec.options]}
              onChange={(v) => onChange?.(spec.key as keyof Inputs, v as Inputs[keyof Inputs])}
              accent={accent ?? lookupColor('artery') ?? '#64748b'}
            />
          );
        }
        const value = inputs ? Number(inputs[spec.key]) : spec.min;
        return (
          <SliderControl
            key={String(spec.key)}
            label={spec.label}
            value={value}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            unit={spec.unit}
            format={spec.format}
            onChange={(v) => onChange?.(spec.key as keyof Inputs, v as Inputs[keyof Inputs])}
            accent={accent ?? lookupColor('artery') ?? '#64748b'}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { gap: SPACE.lg },
  sliderBlock: { gap: 2 },
  pressed: { opacity: 0.5 },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACE.md,
  },
  sliderLabel: { fontSize: FONT.sm, flex: 1 },
  sliderValue: { fontSize: FONT.sm, fontWeight: '600', minWidth: 84, textAlign: 'center' },
  slider: { height: TAP },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  // 44x44, which is the iOS minimum. These were 24pt text glyphs with hitSlop 8 — 40pt at best,
  // and invisible as targets until pressed.
  stepperBtnBox: {
    width: TAP,
    height: TAP,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: { opacity: 0.35 },
  stepperBtn: { fontSize: FONT.xl, fontWeight: '600', lineHeight: FONT.xl + 4 },
  toggleContainer: { paddingBottom: SPACE.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: SPACE.md },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md },
  toggleOption: {
    minHeight: TAP - 8,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  toggleOptionText: { fontSize: FONT.xs, fontWeight: '600' },
});
