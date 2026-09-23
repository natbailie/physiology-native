import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ControlRailView } from './ControlRailView';
import type { ControlSpec } from './types';

/**
 * The community slider has no web implementation, and this suite renders through the
 * react-native-web alias — so the stub stands in for the native control. It forwards the
 * accessibility contract onto a range input the same way the web `Slider.tsx` does, which
 * is what makes the assertions below about `ControlRailView`'s props rather than about
 * the stub: on device, VoiceOver and TalkBack read `accessibilityValue` from the real
 * control.
 */
vi.mock('@react-native-community/slider', () => ({
  default: (props: {
    accessibilityLabel?: string;
    accessibilityValue?: { min?: number; max?: number; now?: number; text?: string };
  }) => (
    <input
      type="range"
      aria-label={props.accessibilityLabel}
      aria-valuetext={props.accessibilityValue?.text}
      data-value-min={props.accessibilityValue?.min}
      data-value-max={props.accessibilityValue?.max}
      data-value-now={props.accessibilityValue?.now}
    />
  ),
}));

afterEach(cleanup);

interface Inputs {
  bloodVolumeMl: number;
  contractility: number;
}

const CONTROLS: readonly ControlSpec<Inputs>[] = [
  { kind: 'slider', label: 'Blood volume', key: 'bloodVolumeMl', min: 2000, max: 6500, step: 50, unit: 'mL' },
  { kind: 'slider', label: 'Contractility', key: 'contractility', min: 0, max: 2, step: 0.02, format: 'percent' },
];

describe('ControlRailView slider value', () => {
  it('announces the badge text, not the raw number', () => {
    render(
      <ControlRailView
        controls={CONTROLS}
        inputs={{ bloodVolumeMl: 5000, contractility: 0.55 }}
        onChange={() => {}}
        accent="#64748b"
      />,
    );
    expect(screen.getByRole('slider', { name: 'Blood volume' }).getAttribute('aria-valuetext')).toBe(
      '5000 mL',
    );
    expect(screen.getByRole('slider', { name: 'Contractility' }).getAttribute('aria-valuetext')).toBe(
      '55%',
    );
  });

  it('exposes the range bounds alongside the text', () => {
    render(
      <ControlRailView
        controls={CONTROLS}
        inputs={{ bloodVolumeMl: 5000, contractility: 0.55 }}
        onChange={() => {}}
        accent="#64748b"
      />,
    );
    const slider = screen.getByRole('slider', { name: 'Blood volume' });
    expect(slider.getAttribute('data-value-min')).toBe('2000');
    expect(slider.getAttribute('data-value-max')).toBe('6500');
    expect(slider.getAttribute('data-value-now')).toBe('5000');
  });
});
