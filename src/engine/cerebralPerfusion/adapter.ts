import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { cerebralPerfusionContent } from './content';
import { cerebralPerfusionNativeLoopConfig } from './nativeLoopConfig';
import { buildCerebralPerfusionPresentation } from './presentation';
import {
  DEFAULT_CEREBRAL_INPUTS,
  CEREBRAL_PRESETS,
  CEREBRAL_PRESET_LABELS,
  CEREBRAL_PRESET_ORDER,
} from './presets';
import { perturbDrainCsf as perturbDrainCsf, perturbAcuteBleed as perturbAcuteBleed } from './engine';
import { CEREBRAL_QUESTIONS } from './questions';
import type { CerebralInternalState, CerebralDerived, CerebralInputs, CerebralHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<CerebralInternalState, CerebralInputs, CerebralDerived, CerebralHistoryPoint> = {
  config: cerebralPerfusionNativeLoopConfig,
  build: ((ctx: PresentationContext<CerebralInternalState, CerebralDerived, CerebralInputs, CerebralHistoryPoint>) =>
    buildCerebralPerfusionPresentation(ctx)),
  defaults: DEFAULT_CEREBRAL_INPUTS,
  presets: CEREBRAL_PRESETS,
  labels: CEREBRAL_PRESET_LABELS,
  order: CEREBRAL_PRESET_ORDER,
  questions: CEREBRAL_QUESTIONS,
  content: cerebralPerfusionContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Drain CSF', onPress: () => perturb((s) => perturbDrainCsf(s, 120)), variant: 'impulse' },
    { label: 'Acute bleed', onPress: () => perturb((s) => perturbAcuteBleed(s, 200)), variant: 'impulse' },
  ],
};
