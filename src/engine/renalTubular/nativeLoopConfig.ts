import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { RENAL_TUBULAR_SIMULATION } from './constants';
import type { RenalTubularDerived, RenalTubularHistoryPoint, RenalTubularInputs, RenalTubularState } from './types';

export const renalTubularNativeLoopConfig: NativeLoopConfig<
  RenalTubularState,
  RenalTubularInputs,
  RenalTubularDerived,
  RenalTubularHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    plasmaOsmolality: snapshot.derived.plasmaOsmolality,
    urineOsmolality: snapshot.derived.finalUrineOsmolality,
    adhLevel: snapshot.derived.adhLevel,
  }),
  maxDtSeconds: RENAL_TUBULAR_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: RENAL_TUBULAR_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: RENAL_TUBULAR_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: RENAL_TUBULAR_SIMULATION.HISTORY_CAPACITY,
  timeScale: RENAL_TUBULAR_SIMULATION.TIME_SCALE,
};
