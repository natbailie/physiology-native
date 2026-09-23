import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ScenarioBar } from './ScenarioBar';

afterEach(cleanup);

const PRESETS = [
  { id: 'normal', label: 'Normal' },
  { id: 'alpha', label: 'Alpha disease' },
];

describe('ScenarioBar', () => {
  it('applies a preset when one is chosen', () => {
    const onApplyPreset = vi.fn();
    render(
      <ScenarioBar presets={PRESETS} activePreset={null} onApplyPreset={onApplyPreset} actions={[]} accent="#000" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alpha disease' }));
    expect(onApplyPreset).toHaveBeenCalledWith('alpha');
  });

  /** A blinded learner must not silently replace the scenario being named. */
  it('locks every control while disabled', () => {
    const onApplyPreset = vi.fn();
    const onAction = vi.fn();
    render(
      <ScenarioBar
        presets={PRESETS}
        activePreset={null}
        onApplyPreset={onApplyPreset}
        actions={[{ label: 'Injure', onPress: onAction }]}
        accent="#000"
        disabled
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alpha disease' }));
    fireEvent.click(screen.getByRole('button', { name: 'Injure' }));
    expect(onApplyPreset).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
  });
});
