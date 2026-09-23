import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettledQuestions } from './useSettledQuestions';

interface FakeState {
  v: number;
}

const CONFIG = {
  createInitialState: () => ({ v: 0 }),
  step: (s: FakeState, inputs: { dial: number }, dt: number) => ({
    state: { v: s.v + inputs.dial * dt },
    derived: { v: s.v + inputs.dial * dt },
  }),
  computeDerived: (s: FakeState) => ({ v: s.v }),
  toHistoryPoint: (snap: { derived: { v: number } }) => snap.derived,
  maxDtSeconds: 1,
  renderIntervalMs: 100,
  historyCapacity: 10,
  timeScale: 1,
};

const DEFAULTS = { dial: 0 };
const PRESETS = { normal: { dial: 0 }, alpha: { dial: 2 } };

const PATTERN = {
  id: 'p1',
  stem: 'A panel pointing at alpha.',
  answer: 'alpha',
  options: ['normal', 'alpha'],
  panel: [{ label: 'Marker', value: (s: { derived: { v: number } }) => s.derived.v }],
  settleSeconds: 4,
  explanation: 'The combination identifies it, at sufficient length here.',
};

const PREDICT = {
  id: 'q1',
  stem: 'Something instructive.',
  setup: {},
  intervention: { label: 'Turn the dial.', inputs: { dial: 3 } },
  prompt: 'What happens?',
  watch: 'the marker',
  correctDirection: 'rises',
  explanation: 'It rises, at sufficient length here.',
  metric: (s: { derived: { v: number } }) => s.derived.v,
  settleSeconds: 2,
  observeSeconds: 2,
};

// Module scope, like every real caller: the hook keys its settle on this identity, and a fresh
// literal every render would re-settle forever.
const QUESTIONS = [PATTERN, PREDICT] as never;

describe('useSettledQuestions', () => {
  it('settles the answer panel and the prediction outcome off the render path', () => {
    const { result } = renderHook(() =>
      useSettledQuestions(CONFIG as never, DEFAULTS, PRESETS, QUESTIONS),
    );
    // Alpha: dial 2 for 4s against a zero start.
    expect(result.current?.patternPanels.get('p1')).toEqual([{ label: 'Marker', value: 8 }]);
    expect(result.current?.outcomes.get('q1')).toMatchObject({
      before: 0,
      after: 6,
      observed: 'rises',
    });
    expect(result.current?.outcomes.get('p1')).toBeNull();
  });
});
