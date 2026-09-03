import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { capillaryExchangeContent } from './content';
import { capillaryExchangeNativeLoopConfig } from './nativeLoopConfig';
import { buildCapillaryExchangePresentation } from './presentation';
import {
  DEFAULT_CAPILLARY_INPUTS,
  CAPILLARY_PRESETS,
  CAPILLARY_PRESET_LABELS,
  CAPILLARY_PRESET_ORDER,
} from './presets';
import { perturbAlbuminInfusion as perturbAlbuminInfusion, perturbStandUp as perturbStandUp } from './engine';
import { CAPILLARY_QUESTIONS } from './questions';
import type { CapillaryState, CapillaryDerived, CapillaryInputs, CapillaryHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<CapillaryState, CapillaryInputs, CapillaryDerived, CapillaryHistoryPoint> = {
  config: capillaryExchangeNativeLoopConfig,
  build: ((ctx: PresentationContext<CapillaryState, CapillaryDerived, CapillaryInputs, CapillaryHistoryPoint>) =>
    buildCapillaryExchangePresentation(ctx)),
  defaults: DEFAULT_CAPILLARY_INPUTS,
  presets: CAPILLARY_PRESETS,
  labels: CAPILLARY_PRESET_LABELS,
  order: CAPILLARY_PRESET_ORDER,
  questions: CAPILLARY_QUESTIONS,
  content: capillaryExchangeContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Albumin infusion', onPress: () => perturb((s) => perturbAlbuminInfusion(s, 500)), variant: 'impulse' },
    { label: 'Stand up', onPress: () => perturb((s) => perturbStandUp(s, 0.04)), variant: 'impulse' },
  ],
};
