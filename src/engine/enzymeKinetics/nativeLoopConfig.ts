import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { KINETICS_SIMULATION } from './constants';
import type { KineticsDerived, KineticsHistoryPoint, KineticsInputs, KineticsInternalState } from './types';

export const enzymeKineticsNativeLoopConfig: NativeLoopConfig<KineticsInternalState, KineticsInputs, KineticsDerived, KineticsHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    rate: snapshot.derived.reactionRateUmPerMin,
    saturationPct: snapshot.derived.saturationPct,
  }),
  maxDtSeconds: KINETICS_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: KINETICS_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: KINETICS_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: KINETICS_SIMULATION.HISTORY_CAPACITY,
  timeScale: KINETICS_SIMULATION.TIME_SCALE,
};
