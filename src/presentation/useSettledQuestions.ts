import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import type { NativeLoopConfig } from '../hooks/useNativeEngineLoop';
import type { Direction, ModuleQuestion } from '../shared/assessment/types';
import { isPatternQuestion } from '../shared/assessment/types';
import { runQuestion } from '../shared/assessment/verifyQuestion';
import { readPanel, runPatternQuestion } from '../shared/assessment/verifyPattern';

export interface PredictOutcome {
  before: number;
  after: number;
  observed: Direction;
  matches: boolean;
  decimals: number;
}

export interface SettledQuestions {
  outcomes: Map<string, PredictOutcome | null>;
  patternPanels: Map<string, ReturnType<typeof readPanel> | null>;
}

/**
 * Settles every question against the engine, off the render path, once per question array.
 *
 * This is not cheap: a module carries up to sixteen questions, each settled twice — before and
 * after its intervention — at `settleSeconds / maxDtSeconds` steps a time. Doing that inside a
 * `useMemo` ran the whole lot synchronously during render, freezing the JS thread before the
 * screen had drawn once. It runs after the navigation animation instead, keyed on the array
 * identity the screen memoises — a fresh literal every render would re-settle forever.
 *
 * Rows render without it: a prediction row needs its outcome only once revealed, and a pattern
 * row renders its panel as soon as it lands — before the commit — so both stay null-tolerant
 * by construction. Extracted from `PracticePanel` so the clinic and the questions tab settle
 * their disjoint sets through the same hook rather than copying it.
 */
export function useSettledQuestions(
  config: NativeLoopConfig<any, any, any, any>,
  defaults: any,
  presets: Record<string, any>,
  questions: readonly ModuleQuestion<any, any, any>[],
): SettledQuestions | null {
  const [settled, setSettled] = useState<SettledQuestions | null>(null);

  useEffect(() => {
    let live = true;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!live) return;
      const outcomes = new Map<string, PredictOutcome | null>();
      const patternPanels = new Map<string, ReturnType<typeof readPanel> | null>();
      for (const q of questions) {
        if (isPatternQuestion(q)) {
          outcomes.set(q.id, null);
          const res = runPatternQuestion(config, defaults, presets, q as never);
          patternPanels.set(q.id, res.panels.get((q as { answer: string }).answer) ?? null);
        } else {
          const res = runQuestion(config, defaults, presets, q as never);
          outcomes.set(q.id, {
            before: res.before,
            after: res.after,
            observed: res.observed,
            matches: res.matches,
            decimals: 2,
          } satisfies PredictOutcome);
        }
      }
      if (live) setSettled({ outcomes, patternPanels });
    });
    return () => {
      live = false;
      task.cancel();
    };
  }, [config, defaults, presets, questions]);

  return settled;
}
