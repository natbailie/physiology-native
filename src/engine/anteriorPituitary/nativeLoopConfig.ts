import { createInitialState, computeDerivedFull, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { PITUITARY_SIMULATION } from './constants';
import type {
  PituitaryDerived,
  PituitaryHistoryPoint,
  PituitaryInputs,
  PituitaryInternalState,
} from './types';

export const anteriorPituitaryNativeLoopConfig: NativeLoopConfig<
  PituitaryInternalState,
  PituitaryInputs,
  PituitaryDerived,
  PituitaryHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived: computeDerivedFull,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    gh: snapshot.derived.ghNgMl,
    prolactin: snapshot.derived.prolactinNgMl,
    igf1: snapshot.derived.igf1NgMl / 10,
  }),
  maxDtSeconds: PITUITARY_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: PITUITARY_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: PITUITARY_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: PITUITARY_SIMULATION.HISTORY_CAPACITY,
  timeScale: PITUITARY_SIMULATION.TIME_SCALE,
};
