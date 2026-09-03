import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { shockStatesNativeLoopConfig } from './nativeLoopConfig';
import { buildShockStatesPresentation } from './presentation';
import {
  DEFAULT_SHOCK_INPUTS,
  SHOCK_PRESETS,
  SHOCK_PRESET_LABELS,
  SHOCK_PRESET_ORDER,
} from './presets';
import { perturbHaemorrhage as perturbHaemorrhage, perturbFluidBolus as perturbFluidBolus } from './engine';
import { SHOCK_QUESTIONS } from './questions';
import type { ShockState, ShockDerived, ShockInputs, ShockHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ShockState, ShockInputs, ShockDerived, ShockHistoryPoint> = {
  config: shockStatesNativeLoopConfig,
  build: ((ctx: PresentationContext<ShockState, ShockDerived, ShockInputs, ShockHistoryPoint>) =>
    buildShockStatesPresentation(ctx)),
  defaults: DEFAULT_SHOCK_INPUTS,
  presets: SHOCK_PRESETS,
  labels: SHOCK_PRESET_LABELS,
  order: SHOCK_PRESET_ORDER,
  questions: SHOCK_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Haemorrhage', onPress: () => perturb((s) => perturbHaemorrhage(s, 1000)), variant: 'impulse' },
    { label: 'Fluid bolus', onPress: () => perturb((s) => perturbFluidBolus(s, 1000)), variant: 'impulse' },
  ],
};
