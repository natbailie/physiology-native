import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Slider from '@react-native-community/slider';
import type { ControlSpec } from './types';
import { lookupColor } from './palette';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const decrement = () => onChange(Math.max(min, +(value - step).toFixed(6)));
  const increment = () => onChange(Math.min(max, +(value + step).toFixed(6)));

  const displayValue = format === 'percent'
    ? `${Math.round(value * 100)}%`
    : step < 1
      ? value.toFixed(step < 0.1 ? 2 : 1)
      : Math.round(value).toString();

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, isDark && styles.textLight]}>{label}</Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={decrement}
            hitSlop={8}
            accessibilityLabel={`Decrease ${label}`}
            style={({ pressed }) => [styles.stepperBtnBox, pressed && styles.pressed]}
          >
            <Text style={[styles.stepperBtn, isDark && styles.stepperBtnDark]}>−</Text>
          </Pressable>
          <Text style={[styles.sliderValue, isDark && styles.textLight]}>
            {displayValue}{unit ? ` ${unit}` : ''}
          </Text>
          <Pressable
            onPress={increment}
            hitSlop={8}
            accessibilityLabel={`Increase ${label}`}
            style={({ pressed }) => [styles.stepperBtnBox, pressed && styles.pressed]}
          >
            <Text style={[styles.stepperBtn, isDark && styles.stepperBtnDark]}>+</Text>
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
        maximumTrackTintColor={isDark ? '#334155' : '#e2e8f0'}
        thumbTintColor={accent}
        accessibilityLabel={label}
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
}

function ToggleGroup({ label, value, options, onChange }: ToggleGroupProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View style={styles.toggleContainer}>
      <Text style={[styles.sliderLabel, isDark && styles.textLight]}>{label}</Text>
      <View style={styles.toggleRow}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Text
              key={opt.value}
              style={[
                styles.toggleOption,
                isDark && styles.toggleOptionDark,
                selected && styles.toggleOptionSelected,
                selected && isDark && styles.toggleOptionSelectedDark,
              ]}
              onPress={() => onChange(opt.value)}
            >
              {opt.label}
            </Text>
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
  rail: { gap: 12 },
  sliderBlock: { gap: 2 },
  stepperBtnBox: { paddingHorizontal: 4, paddingVertical: 2 },
  pressed: { opacity: 0.5 },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  sliderLabel: { fontSize: 15, color: '#0f172a', flex: 1 },
  sliderValue: { fontSize: 14, color: '#64748b', minWidth: 80, textAlign: 'right' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: '600',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  stepperBtnDark: { color: '#60a5fa' },
  toggleContainer: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toggleOption: {
    fontSize: 13,
    color: '#64748b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  toggleOptionDark: { backgroundColor: '#1e293b', color: '#94a3b8' },
  toggleOptionSelected: { backgroundColor: '#3b82f6', color: '#ffffff' },
  toggleOptionSelectedDark: { backgroundColor: '#2563eb' },
  textLight: { color: '#e2e8f0' },
});
