import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { pregnancyContent } from './content';
import { diagramClasses } from './diagramClasses';
import { pregnancyNativeLoopConfig } from './nativeLoopConfig';
import { buildPregnancyPresentation } from './presentation';
import {
  DEFAULT_PREGNANCY_INPUTS,
  PREGNANCY_PRESETS,
  PREGNANCY_PRESET_LABELS,
  PREGNANCY_PRESET_ORDER,
} from './presets';
import { perturbStartLabour as perturbStartLabour, perturbFeedNow as perturbFeedNow } from './engine';
import { PREGNANCY_QUESTIONS } from './questions';
import type { PregnancyInternalState, PregnancyDerived, PregnancyInputs, PregnancyHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<PregnancyInternalState, PregnancyInputs, PregnancyDerived, PregnancyHistoryPoint> = {
  config: pregnancyNativeLoopConfig,
  build: ((ctx: PresentationContext<PregnancyInternalState, PregnancyDerived, PregnancyInputs, PregnancyHistoryPoint>) =>
    buildPregnancyPresentation(ctx)),
  defaults: DEFAULT_PREGNANCY_INPUTS,
  presets: PREGNANCY_PRESETS,
  labels: PREGNANCY_PRESET_LABELS,
  order: PREGNANCY_PRESET_ORDER,
  questions: PREGNANCY_QUESTIONS,
  content: pregnancyContent,
  diagramClasses,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Start labour', onPress: () => perturb((s) => perturbStartLabour(s)), variant: 'impulse' },
    { label: 'Feed now', onPress: () => perturb((s) => perturbFeedNow(s)), variant: 'impulse' },
  ],
};
