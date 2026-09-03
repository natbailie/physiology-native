import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { anteriorPituitaryContent } from './content';
import { anteriorPituitaryNativeLoopConfig } from './nativeLoopConfig';
import { buildAnteriorPituitaryPresentation } from './presentation';
import {
  DEFAULT_PITUITARY_INPUTS,
  PITUITARY_PRESETS,
  PITUITARY_PRESET_LABELS,
  PITUITARY_PRESET_ORDER,
} from './presets';
import { perturbGlucoseLoad as perturbGlucoseLoad, perturbBromocriptineDose as perturbBromocriptineDose } from './engine';
import { PITUITARY_QUESTIONS } from './questions';
import type { PituitaryInternalState, PituitaryDerived, PituitaryInputs, PituitaryHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<PituitaryInternalState, PituitaryInputs, PituitaryDerived, PituitaryHistoryPoint> = {
  config: anteriorPituitaryNativeLoopConfig,
  build: ((ctx: PresentationContext<PituitaryInternalState, PituitaryDerived, PituitaryInputs, PituitaryHistoryPoint>) =>
    buildAnteriorPituitaryPresentation(ctx)),
  defaults: DEFAULT_PITUITARY_INPUTS,
  presets: PITUITARY_PRESETS,
  labels: PITUITARY_PRESET_LABELS,
  order: PITUITARY_PRESET_ORDER,
  questions: PITUITARY_QUESTIONS,
  content: anteriorPituitaryContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Glucose load', onPress: () => perturb((s) => perturbGlucoseLoad(s)), variant: 'impulse' },
    { label: 'Bromocriptine', onPress: () => perturb((s) => perturbBromocriptineDose(s)), variant: 'impulse' },
  ],
};
