import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { immuneResponseNativeLoopConfig } from './nativeLoopConfig';
import { buildImmuneResponsePresentation } from './presentation';
import {
  DEFAULT_IMMUNE_INPUTS,
  IMMUNE_PRESETS,
  IMMUNE_PRESET_LABELS,
  PRESET_ORDER as IMMUNE_PRESET_ORDER,
} from './presets';
import { perturbInfect as perturbInfect, perturbVaccinate as perturbVaccinate } from './engine';
import { IMMUNE_QUESTIONS } from './questions';
import type { ImmuneState, ImmuneDerived, ImmuneInputs, ImmuneHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ImmuneState, ImmuneInputs, ImmuneDerived, ImmuneHistoryPoint> = {
  config: immuneResponseNativeLoopConfig,
  build: ((ctx: PresentationContext<ImmuneState, ImmuneDerived, ImmuneInputs, ImmuneHistoryPoint>) =>
    buildImmuneResponsePresentation(ctx)),
  defaults: DEFAULT_IMMUNE_INPUTS,
  presets: IMMUNE_PRESETS,
  labels: IMMUNE_PRESET_LABELS,
  order: IMMUNE_PRESET_ORDER,
  questions: IMMUNE_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Infect', onPress: () => perturb((s) => perturbInfect(s)), variant: 'impulse' },
    { label: 'Vaccinate', onPress: () => perturb((s) => perturbVaccinate(s)), variant: 'impulse' },
  ],
};
