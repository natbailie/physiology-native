import { computeDerived, createInitialState, step } from './engine';
import type { NativeLoopConfig } from '../../hooks/useNativeEngineLoop';

import { THERMO_SIMULATION } from './constants';
import type {
  ThermoDerived,
  ThermoHistoryPoint,
  ThermoInputs,
  ThermoInternalState,
} from './types';

export const thermoregulationNativeLoopConfig: NativeLoopConfig<
  ThermoInternalState,
  ThermoInputs,
  ThermoDerived,
  ThermoHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    core: snapshot.derived.coreTempC,
    setPoint: snapshot.derived.setPointC,
    skin: snapshot.derived.skinTempC,
  }),
  maxDtSeconds: THERMO_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: THERMO_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: THERMO_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: THERMO_SIMULATION.HISTORY_CAPACITY,
  timeScale: THERMO_SIMULATION.TIME_SCALE,
};
