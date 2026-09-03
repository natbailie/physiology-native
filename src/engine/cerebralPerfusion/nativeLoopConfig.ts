import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { CEREBRAL_SIMULATION } from './constants';
import type { CerebralDerived, CerebralHistoryPoint, CerebralInputs, CerebralInternalState } from './types';

export const cerebralPerfusionNativeLoopConfig: NativeLoopConfig<
  CerebralInternalState,
  CerebralInputs,
  CerebralDerived,
  CerebralHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    icp: snapshot.derived.intracranialPressureMmHg,
    cpp: snapshot.derived.cerebralPerfusionPressureMmHg,
    cbf: snapshot.derived.cerebralBloodFlow,
    cbv: snapshot.derived.cerebralBloodVolumeMl,
  }),
  maxDtSeconds: CEREBRAL_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: CEREBRAL_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: CEREBRAL_SIMULATION.HISTORY_CAPACITY,
  timeScale: CEREBRAL_SIMULATION.TIME_SCALE,
};
