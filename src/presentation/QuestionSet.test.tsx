import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QuestionSet } from './QuestionSet';
import type { CommittedAnswer } from './QuestionRows';
import type { ReviewState } from '../shared/assessment/scheduling';

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

const FREE_Q = {
  id: 'free-q',
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
  oneLiner: 'A presenting complaint.',
  presentation: 'History.',
  preset: 'alpha',
  chart: [],
  task: 'Task.',
  teaching: 'Teaching.',
  questionIds: ['bed-q'],
};

const EMPTY_SCHEDULE = {} as Record<string, ReviewState>;
const DUE_SCHEDULE = {
  'bed-q': { box: 0, dueAt: 0, lapses: 1, lastAt: 0 },
} as Record<string, ReviewState>;

function show({
  schedule = EMPTY_SCHEDULE,
  onGoBedside = () => {},
}: {
  schedule?: Record<string, ReviewState>;
  onGoBedside?: (bedId: string) => void;
} = {}) {
  return render(
    <QuestionSet
      count={1}
      beds={[BED] as never}
      schedule={schedule}
      questions={[FREE_Q] as never}
      onGoBedside={onGoBedside}
      accent="#000"
      committed={new Map<string, CommittedAnswer>()}
      onCommit={() => {}}
      presetLabels={LABELS}
      config={CONFIG as never}
      defaults={DEFAULTS}
      presets={PRESETS}
    />,
  );
}

describe('QuestionSet', () => {
  it('names the unclaimed set and renders its instrument before committing', () => {
    show();
    expect(screen.getByText(/one question that tests whether you can predict/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Alpha disease' })).toBeDefined();
    // Settled alpha: dial 2 for 1s.
    expect(screen.getByText('2.00')).toBeDefined();
    expect(screen.queryByText(/Also due at the bedside/)).toBeNull();
  });

  it('points at work waiting at the bedside, and goes there on press', () => {
    const onGoBedside = vi.fn();
    show({ schedule: DUE_SCHEDULE, onGoBedside });
    expect(screen.getByText(/Also due at the bedside/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Ann \(1\)/ }));
    expect(onGoBedside).toHaveBeenCalledWith('bed-a');
  });
});
