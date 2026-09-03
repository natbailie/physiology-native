import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { RESP_MECH_SIMULATION } from './constants';
import type { RespMechDerived, RespMechHistoryPoint, RespMechInputs, RespMechState } from './types';

export const respiratoryMechanicsNativeLoopConfig: NativeLoopConfig<RespMechState, RespMechInputs, RespMechDerived, RespMechHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    lungVolume: snapshot.derived.lungVolumeML,
    airflow: snapshot.derived.airflowMLPerSec,
  }),
  maxDtSeconds: RESP_MECH_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: RESP_MECH_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: RESP_MECH_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: RESP_MECH_SIMULATION.HISTORY_CAPACITY,
  timeScale: RESP_MECH_SIMULATION.TIME_SCALE,
};
