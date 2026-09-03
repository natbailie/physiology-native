import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { PREGNANCY_SIMULATION } from './constants';
import type {
  PregnancyDerived,
  PregnancyHistoryPoint,
  PregnancyInputs,
  PregnancyInternalState,
} from './types';

export const pregnancyNativeLoopConfig: NativeLoopConfig<
  PregnancyInternalState,
  PregnancyInputs,
  PregnancyDerived,
  PregnancyHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    hb: snapshot.derived.haemoglobinGPerDl,
    progesterone: snapshot.state.progesteroneNgMl,
    milk: snapshot.state.milkSupplyMlPerDay,
    dilation: snapshot.state.cervicalDilationCm,
  }),
  maxDtSeconds: PREGNANCY_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: PREGNANCY_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: PREGNANCY_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: PREGNANCY_SIMULATION.HISTORY_CAPACITY,
  timeScale: PREGNANCY_SIMULATION.TIME_SCALE,
};
