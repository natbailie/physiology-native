import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { TOXICOLOGY_SIMULATION } from './constants';
import type { ToxicologyDerived, ToxicologyHistoryPoint, ToxicologyInputs, ToxicologyInternalState } from './types';

export const toxicologyNativeLoopConfig: NativeLoopConfig<ToxicologyInternalState, ToxicologyInputs, ToxicologyDerived, ToxicologyHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: TOXICOLOGY_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: TOXICOLOGY_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: TOXICOLOGY_SIMULATION.HISTORY_CAPACITY,
  timeScale: TOXICOLOGY_SIMULATION.TIME_SCALE,
};