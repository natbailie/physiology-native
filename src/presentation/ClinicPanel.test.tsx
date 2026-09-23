import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ClinicPanel } from './ClinicPanel';
import type { CommittedAnswer } from './QuestionRows';

afterEach(cleanup);

const CONFIG = {
  createInitialState: () => ({ v: 0 }),
  step: (s: { v: number }, inputs: { dial: number }, dt: number) => ({
    state: { v: s.v + inputs.dial * dt },
    derived: { v: s.v + inputs.dial * dt },
  }),
  computeDerived: (s: { v: number }) => ({ v: s.v }),
  toHistoryPoint: (snap: { derived: { v: number } }) => snap.derived,
  maxDtSeconds: 1,
  renderIntervalMs: 100,
  historyCapacity: 10,
  timeScale: 1,
};

const DEFAULTS = { dial: 0 };
const PRESETS = { normal: { dial: 0 }, alpha: { dial: 2 } };
const LABELS = { normal: 'Normal', alpha: 'Alpha disease' };

const BED_Q = {
  id: 'bq',
  stem: 'A panel pointing at alpha.',
  answer: 'alpha',
  options: ['normal', 'alpha'],
  panel: [{ label: 'Marker', value: (s: { derived: { v: number } }) => s.derived.v }],
  settleSeconds: 1,
  explanation: 'The combination identifies it, at sufficient length here.',
};

const BED = {
  id: 'bed-a',
  name: 'Ann',
  age: 40,
  bed: 'A01',
  oneLiner: 'A presenting complaint, not a diagnosis.',
  presentation: 'What a colleague would tell you on the way to the bed.',
  preset: 'alpha',
  chart: [{ label: 'MAP', value: (s: any) => s.derived.map, unit: 'mmHg', decimals: 0 }],
  task: 'Name the shock before anyone reaches for fluid.',
  teaching: 'Both filling pressures are empty and the resistance is up, at length here.',
  questionIds: ['bq'],
};

const SNAPSHOT = { state: {}, derived: { map: 62 } };

function show({
  patient = null,
  committed = new Map<string, CommittedAnswer>(),
  onSelectBed = () => {},
  onCommit = () => {},
  schedule = {},
}: {
  patient?: typeof BED | null;
  committed?: ReadonlyMap<string, CommittedAnswer>;
  onSelectBed?: (id: string | null) => void;
  onCommit?: (id: string, picked: string, correct: boolean) => void;
  schedule?: Record<string, { box: number; dueAt: number; lapses: number; lastAt: number }>;
} = {}) {
  return render(
    <ClinicPanel
      cases={[BED] as never}
      patient={patient as never}
      onSelectBed={onSelectBed}
      schedule={schedule as never}
      snapshot={SNAPSHOT}
      questions={[BED_Q] as never}
      moduleId="test-module"
      accent="#000"
      committed={committed}
      onCommit={onCommit}
      presetLabels={LABELS}
      config={CONFIG as never}
      defaults={DEFAULTS}
      presets={PRESETS}
    />,
  );
}

describe('ClinicPanel', () => {
  it('lists every bed and reports the pick', () => {
    const onSelectBed = vi.fn();
    show({ onSelectBed });
    fireEvent.click(screen.getByRole('button', { name: /Ann, 40/ }));
    expect(onSelectBed).toHaveBeenCalledWith('bed-a');
  });

  it('asks for a patient when none is picked', () => {
    show();
    expect(screen.getByText(/Choose a patient/)).toBeDefined();
  });

  it('shows history, live chart and task while the bed is fresh', () => {
    show({ patient: BED });
    expect(screen.getByText(BED.presentation)).toBeDefined();
    expect(screen.getByText('62')).toBeDefined();
    expect(screen.getByText(BED.task)).toBeDefined();
    expect(screen.queryByText(/What this bed teaches/)).toBeNull();
  });

  it('withdraws the live chart once the bed is engaged and pays off at the end', () => {
    show({ patient: BED, committed: new Map([['bq', { picked: 'alpha', correct: true }]]) });
    // The engine may have been explored since; the rows carry their own settled panels.
    expect(screen.queryByText('62')).toBeNull();
    expect(screen.queryByText(BED.task)).toBeNull();
    expect(screen.getByText('Correct')).toBeDefined();
    expect(screen.getByText(/What this bed teaches/)).toBeDefined();
    expect(screen.getByText(BED.teaching)).toBeDefined();
  });

  it('prints an acuity chip per bed and the one-liner under the selected patient', () => {
    // Untouched ladder: the bed is somebody nobody has met.
    show({ patient: BED });
    expect(screen.getByText('NEW')).toBeDefined();
    expect(screen.getByText(BED.oneLiner)).toBeDefined();
  });

  it('reads the chip off the review ladder, not the case file', () => {
    show({ schedule: { bq: { box: 0, dueAt: 0, lapses: 2, lastAt: 0 } } });
    expect(screen.getByText('CRASH')).toBeDefined();
    expect(screen.queryByText('NEW')).toBeNull();
  });
  /**
   * A selected bed is filled with the module accent, so the chip inside it is no longer on a card
   * surface. It used to keep the acuity signal colour there — measured at 1.00-1.60:1 against its
   * own background across every bedded module, and exactly 1.00:1 for gastrointestinal, whose
   * accent IS `--danger`. The invariant is not a number a test can read: it is that the chip and
   * the name beside it agree about what ground they are on.
   */
  it('takes the chip off the acuity colour when the bed is filled with the accent', () => {
    const schedule = { bq: { box: 0, dueAt: 0, lapses: 2, lastAt: 0 } };

    const { unmount } = show({ schedule });
    const unselected = getComputedStyle(screen.getByText('CRASH')).color;
    unmount();

    show({ patient: BED, schedule });
    const chip = getComputedStyle(screen.getByText('CRASH')).color;
    const nameBeside = getComputedStyle(screen.getAllByText('Ann, 40')[0]!).color;

    expect(chip, 'the chip kept the acuity colour onto the accent fill').not.toBe(unselected);
    expect(chip, 'the chip and the name beside it disagree about their ground').toBe(nameBeside);
  });

});
