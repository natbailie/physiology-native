import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { COAG_SIMULATION } from './constants';
import type { CoagDerived, CoagHistoryPoint, CoagInputs, CoagState } from './types';

export const coagulationNativeLoopConfig: NativeLoopConfig<CoagState, CoagInputs, CoagDerived, CoagHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    thrombin: snapshot.derived.thrombin,
    fibrin: snapshot.derived.fibrin,
    plateletPlug: snapshot.derived.plateletPlug,
  }),
  maxDtSeconds: COAG_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: COAG_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: COAG_SIMULATION.HISTORY_CAPACITY,
  timeScale: COAG_SIMULATION.TIME_SCALE,
};
