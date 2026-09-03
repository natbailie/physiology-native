import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { MUSCLE_SIMULATION } from './constants';
import type { MuscleDerived, MuscleHistoryPoint, MuscleInputs, MuscleState } from './types';

export const muscleContractionNativeLoopConfig: NativeLoopConfig<MuscleState, MuscleInputs, MuscleDerived, MuscleHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    calcium: snapshot.derived.cytosolicCalciumUM,
    tension: snapshot.derived.totalTension,
    length: snapshot.derived.sarcomereLengthUm,
  }),
  maxDtSeconds: MUSCLE_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: MUSCLE_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: MUSCLE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: MUSCLE_SIMULATION.HISTORY_CAPACITY,
  timeScale: MUSCLE_SIMULATION.TIME_SCALE,
};
