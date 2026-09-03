import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { renalTubularNativeLoopConfig } from './nativeLoopConfig';
import { buildRenalTubularPresentation } from './presentation';
import {
  DEFAULT_RENAL_TUBULAR_INPUTS,
  RENAL_TUBULAR_PRESETS,
  RENAL_TUBULAR_PRESET_LABELS,
  PRESET_ORDER as RENAL_TUBULAR_PRESET_ORDER,
} from './presets';
import { perturbWaterDeprivation as perturbWaterDeprivation } from './engine';
import { RENAL_TUBULAR_QUESTIONS } from './questions';
import type { RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<RenalTubularState, RenalTubularInputs, RenalTubularDerived, RenalTubularHistoryPoint> = {
  config: renalTubularNativeLoopConfig,
  build: ((ctx: PresentationContext<RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint>) =>
    buildRenalTubularPresentation(ctx)),
  defaults: DEFAULT_RENAL_TUBULAR_INPUTS,
  presets: RENAL_TUBULAR_PRESETS,
  labels: RENAL_TUBULAR_PRESET_LABELS,
  order: RENAL_TUBULAR_PRESET_ORDER,
  questions: RENAL_TUBULAR_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Water deprivation', onPress: () => perturb((s) => perturbWaterDeprivation(s, 120)), variant: 'impulse' },
  ],
};
