import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { venousReturnContent } from './content';
import { venousReturnNativeLoopConfig } from './nativeLoopConfig';
import { buildVenousReturnPresentation } from './presentation';
import {
  DEFAULT_VENOUS_RETURN_INPUTS,
  VENOUS_RETURN_PRESETS,
  VENOUS_RETURN_PRESET_LABELS,
  VENOUS_RETURN_PRESET_ORDER,
} from './presets';
import { perturbHemorrhage as perturbHemorrhage, perturbTransfusion as perturbTransfusion, perturbValsalva as perturbValsalva } from './engine';
import { VENOUS_RETURN_QUESTIONS } from './questions';
import type { VenousReturnState, VenousReturnDerived, VenousReturnInputs, VenousReturnHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<VenousReturnState, VenousReturnInputs, VenousReturnDerived, VenousReturnHistoryPoint> = {
  config: venousReturnNativeLoopConfig,
  build: ((ctx: PresentationContext<VenousReturnState, VenousReturnDerived, VenousReturnInputs, VenousReturnHistoryPoint>) =>
    buildVenousReturnPresentation(ctx)),
  defaults: DEFAULT_VENOUS_RETURN_INPUTS,
  presets: VENOUS_RETURN_PRESETS,
  labels: VENOUS_RETURN_PRESET_LABELS,
  order: VENOUS_RETURN_PRESET_ORDER,
  questions: VENOUS_RETURN_QUESTIONS,
  content: venousReturnContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Haemorrhage', onPress: () => perturb((s) => perturbHemorrhage(s, 1000)), variant: 'impulse' },
    { label: 'Transfusion', onPress: () => perturb((s) => perturbTransfusion(s, 1000)), variant: 'impulse' },
    { label: 'Valsalva', onPress: () => perturb((s) => perturbValsalva(s)), variant: 'impulse' },
  ],
};
