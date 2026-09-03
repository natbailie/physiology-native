import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { VESTIBULAR_SIMULATION } from './constants';
import type {
  VestibularDerived,
  VestibularHistoryPoint,
  VestibularInputs,
  VestibularInternalState,
} from './types';

export const vestibularNativeLoopConfig: NativeLoopConfig<
  VestibularInternalState,
  VestibularInputs,
  VestibularDerived,
  VestibularHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    spv: snapshot.derived.slowPhaseVelocityDegPerSec,
    vertigo: snapshot.derived.vertigoIntensityPct,
    cupula: snapshot.derived.cupulaDeflection * 100,
  }),
  maxDtSeconds: VESTIBULAR_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: VESTIBULAR_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: VESTIBULAR_SIMULATION.HISTORY_CAPACITY,
  timeScale: VESTIBULAR_SIMULATION.TIME_SCALE,
};
