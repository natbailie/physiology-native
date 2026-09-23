import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CaseHeader } from './CaseHeader';

afterEach(cleanup);

const PATIENT = {
  id: 'bed-a',
  name: 'Ann',
  age: 40,
  bed: 'A01',
  oneLiner: 'A presenting complaint, not a diagnosis.',
  presentation: 'What a colleague would tell you on the way to the bed.',
  preset: 'alpha',
  chart: [],
  task: 'Work out what is going on.',
  teaching: 'The payoff, at sufficient length here.',
};

const LABELS = { normal: 'Normal', alpha: 'Alpha disease' };

function show(overrides: Partial<React.ComponentProps<typeof CaseHeader>> = {}) {
  return render(
    <CaseHeader
      patient={PATIENT as never}
      activePreset={null}
      presetLabels={LABELS}
      onReturn={() => {}}
      playing
      accent="#000"
      {...overrides}
    />,
  );
}

describe('CaseHeader', () => {
  it('names the bed, the scenario and the running state', () => {
    show();
    expect(screen.getByLabelText('Bedside: Ann')).toBeTruthy();
    expect(screen.getByText(/A01/)).toBeTruthy();
    expect(screen.getByText(/Alpha disease/)).toBeTruthy();
    expect(screen.getByText(/Live/)).toBeTruthy();
  });

  it('goes stale honestly with a way back when the scenario diverges', () => {
    const onReturn = vi.fn();
    show({ activePreset: 'normal', onReturn, playing: false });
    expect(screen.getByText(/no longer Ann's numbers/)).toBeTruthy();
    expect(screen.getByText(/Paused/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Ann' }));
    expect(onReturn).toHaveBeenCalledOnce();
  });

  it('shows the one-liner while the loaded scenario matches', () => {
    show({ activePreset: 'alpha' });
    expect(screen.getByText(PATIENT.oneLiner)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back to Ann' })).toBeNull();
  });
});
