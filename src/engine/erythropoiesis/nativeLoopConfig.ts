import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { ERYTHRO_SIMULATION } from './constants';
import type { ErythroDerived, ErythroHistoryPoint, ErythroInputs, ErythroState } from './types';

export const erythropoiesisNativeLoopConfig: NativeLoopConfig<ErythroState, ErythroInputs, ErythroDerived, ErythroHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    hemoglobin: snapshot.derived.hemoglobinGDl,
    epo: snapshot.derived.epoLevel,
    reticulocyteIndex: snapshot.derived.reticulocyteIndex,
  }),
  maxDtSeconds: ERYTHRO_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: ERYTHRO_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: ERYTHRO_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: ERYTHRO_SIMULATION.HISTORY_CAPACITY,
  timeScale: ERYTHRO_SIMULATION.TIME_SCALE,
};
