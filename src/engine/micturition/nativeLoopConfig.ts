import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { SIMULATION } from './constants';
import type {
  MicturitionDerived,
  MicturitionHistoryPoint,
  MicturitionInputs,
  MicturitionInternalState,
} from './types';

export const micturitionNativeLoopConfig: NativeLoopConfig<
  MicturitionInternalState,
  MicturitionInputs,
  MicturitionDerived,
  MicturitionHistoryPoint
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
