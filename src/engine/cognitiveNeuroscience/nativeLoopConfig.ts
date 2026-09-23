import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { COGNITION_SIMULATION } from './constants';
import type { CognitionDerived, CognitionHistoryPoint, CognitionInputs, CognitionInternalState } from './types';

export const cognitionNativeLoopConfig: NativeLoopConfig<CognitionInternalState, CognitionInputs, CognitionDerived, CognitionHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: COGNITION_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: COGNITION_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: COGNITION_SIMULATION.HISTORY_CAPACITY,
  timeScale: COGNITION_SIMULATION.TIME_SCALE,
};