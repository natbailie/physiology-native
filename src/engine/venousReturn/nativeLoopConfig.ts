import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { VENOUS_RETURN_SIMULATION } from './constants';
import type { VenousReturnDerived, VenousReturnHistoryPoint, VenousReturnInputs, VenousReturnState } from './types';

export const venousReturnNativeLoopConfig: NativeLoopConfig<
  VenousReturnState,
  VenousReturnInputs,
  VenousReturnDerived,
  VenousReturnHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pra: snapshot.derived.rightAtrialPressureMmHg,
    cardiacOutput: snapshot.derived.cardiacOutputLPerMin,
    venousReturn: snapshot.derived.venousReturnLPerMin,
    meanSystemicFillingPressure: snapshot.derived.meanSystemicFillingPressureMmHg,
  }),
  maxDtSeconds: VENOUS_RETURN_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: VENOUS_RETURN_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: VENOUS_RETURN_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: VENOUS_RETURN_SIMULATION.HISTORY_CAPACITY,
  timeScale: VENOUS_RETURN_SIMULATION.TIME_SCALE,
};
