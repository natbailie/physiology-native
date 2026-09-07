import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { RF_SIMULATION } from './constants';
import type { RfDerived, RfHistoryPoint, RfInputs, RfState } from './types';

export const respiratoryFailureNativeLoopConfig: NativeLoopConfig<RfState, RfInputs, RfDerived, RfHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    paO2: snapshot.derived.paO2,
    paCO2: snapshot.derived.paCO2,
  }),
  maxDtSeconds: RF_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: RF_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: RF_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: RF_SIMULATION.HISTORY_CAPACITY,
  timeScale: RF_SIMULATION.TIME_SCALE,
};