import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { ECG_SIMULATION } from './constants';
import type { EcgDerived, EcgHistoryPoint, EcgInputs, EcgState } from './types';

export const ecgConductionNativeLoopConfig: NativeLoopConfig<EcgState, EcgInputs, EcgDerived, EcgHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    voltageMv: snapshot.derived.ecgVoltageMv,
  }),
  maxDtSeconds: ECG_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: ECG_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: ECG_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: ECG_SIMULATION.HISTORY_CAPACITY,
  timeScale: ECG_SIMULATION.TIME_SCALE,
};
