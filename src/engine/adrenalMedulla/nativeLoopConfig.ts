import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { MEDULLA_SIMULATION } from './constants';
import type {
  MedullaDerived,
  MedullaHistoryPoint,
  MedullaInputs,
  MedullaInternalState,
} from './types';

export const adrenalMedullaNativeLoopConfig: NativeLoopConfig<
  MedullaInternalState,
  MedullaInputs,
  MedullaDerived,
  MedullaHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    map: snapshot.derived.mapMmHg,
    hr: snapshot.derived.heartRateBpm,
    volume: snapshot.state.bloodVolumePct,
  }),
  maxDtSeconds: MEDULLA_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: MEDULLA_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: MEDULLA_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: MEDULLA_SIMULATION.HISTORY_CAPACITY,
  timeScale: MEDULLA_SIMULATION.TIME_SCALE,
};
