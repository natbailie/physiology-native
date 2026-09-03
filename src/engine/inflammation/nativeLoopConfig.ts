import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { SIMULATION } from './constants';
import type {
  InflammationDerived,
  InflammationHistoryPoint,
  InflammationInputs,
  InflammationInternalState,
} from './types';

export const inflammationNativeLoopConfig: NativeLoopConfig<
  InflammationInternalState,
  InflammationInputs,
  InflammationDerived,
  InflammationHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: SIMULATION.HISTORY_CAPACITY,
  timeScale: SIMULATION.TIME_SCALE,
};
