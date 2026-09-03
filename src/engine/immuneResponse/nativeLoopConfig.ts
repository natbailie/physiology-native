import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { IMMUNE_SIMULATION } from './constants';
import type { ImmuneDerived, ImmuneHistoryPoint, ImmuneInputs, ImmuneState } from './types';

export const immuneResponseNativeLoopConfig: NativeLoopConfig<ImmuneState, ImmuneInputs, ImmuneDerived, ImmuneHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pathogenLoad: snapshot.derived.pathogenLoad,
    iggTitre: snapshot.derived.iggTitre,
    memoryLevel: snapshot.derived.memoryLevel,
  }),
  maxDtSeconds: IMMUNE_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: IMMUNE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: IMMUNE_SIMULATION.HISTORY_CAPACITY,
  timeScale: IMMUNE_SIMULATION.TIME_SCALE,
};
