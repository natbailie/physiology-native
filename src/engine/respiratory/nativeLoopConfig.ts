import { computeDerived, createInitialState, step } from './engine';
import { RESP_SIMULATION } from './constants';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from './types';

export const respiratoryNativeLoopConfig: NativeLoopConfig<RespState, RespInputs, RespDerived, RespHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pH: snapshot.derived.pH,
    paCO2: snapshot.derived.paCO2,
    saO2: snapshot.derived.saO2,
    plasmaHCO3: snapshot.derived.plasmaHCO3,
  }),
  maxDtSeconds: RESP_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: RESP_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: RESP_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: RESP_SIMULATION.HISTORY_CAPACITY,
  timeScale: RESP_SIMULATION.TIME_SCALE,
};
