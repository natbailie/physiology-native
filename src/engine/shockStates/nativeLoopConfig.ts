import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { SHOCK_SIMULATION } from './constants';
import type { ShockDerived, ShockHistoryPoint, ShockInputs, ShockState } from './types';

export const shockStatesNativeLoopConfig: NativeLoopConfig<ShockState, ShockInputs, ShockDerived, ShockHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    map: snapshot.derived.meanArterialPressureMmHg,
    cardiacOutput: snapshot.derived.cardiacOutputLPerMin,
    cvp: snapshot.derived.centralVenousPressureMmHg,
    lactate: snapshot.derived.lactateMmolL,
    svo2: snapshot.derived.mixedVenousSaturationPercent,
  }),
  maxDtSeconds: SHOCK_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: SHOCK_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: SHOCK_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: SHOCK_SIMULATION.HISTORY_CAPACITY,
  timeScale: SHOCK_SIMULATION.TIME_SCALE,
};
