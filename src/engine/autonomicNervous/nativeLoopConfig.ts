import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { ANS_SIMULATION } from './constants';
import type { AnsDerived, AnsHistoryPoint, AnsInputs, AnsState } from './types';

export const autonomicNervousNativeLoopConfig: NativeLoopConfig<AnsState, AnsInputs, AnsDerived, AnsHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    heartRate: snapshot.derived.heartRateBpm,
    giMotility: snapshot.derived.giMotilityIndex,
    pupilDiameter: snapshot.derived.pupilDiameterMm,
  }),
  maxDtSeconds: ANS_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: ANS_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: ANS_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: ANS_SIMULATION.HISTORY_CAPACITY,
  timeScale: ANS_SIMULATION.TIME_SCALE,
};
