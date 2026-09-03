import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { somaticSensationContent } from './content';
import { somaticSensationNativeLoopConfig } from './nativeLoopConfig';
import { buildSomaticSensationPresentation } from './presentation';
import {
  DEFAULT_SOMATIC_INPUTS,
  SOMATIC_PRESETS,
  SOMATIC_PRESET_LABELS,
  SOMATIC_PRESET_ORDER,
} from './presets';
import { perturbOpioidBolus as perturbOpioidBolus, perturbTissueInjury as perturbTissueInjury } from './engine';
import { SOMATIC_QUESTIONS } from './questions';
import type { SomaticInternalState, SomaticDerived, SomaticInputs, SomaticHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<SomaticInternalState, SomaticInputs, SomaticDerived, SomaticHistoryPoint> = {
  config: somaticSensationNativeLoopConfig,
  build: ((ctx: PresentationContext<SomaticInternalState, SomaticDerived, SomaticInputs, SomaticHistoryPoint>) =>
    buildSomaticSensationPresentation(ctx)),
  defaults: DEFAULT_SOMATIC_INPUTS,
  presets: SOMATIC_PRESETS,
  labels: SOMATIC_PRESET_LABELS,
  order: SOMATIC_PRESET_ORDER,
  questions: SOMATIC_QUESTIONS,
  content: somaticSensationContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Opioid bolus', onPress: () => perturb((s) => perturbOpioidBolus(s)), variant: 'impulse' },
    { label: 'Tissue injury', onPress: () => perturb((s) => perturbTissueInjury(s)), variant: 'impulse' },
  ],
};
