import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { muscleContractionContent } from './content';
import { muscleContractionNativeLoopConfig } from './nativeLoopConfig';
import { buildMuscleContractionPresentation } from './presentation';
import {
  DEFAULT_MUSCLE_INPUTS,
  MUSCLE_PRESETS,
  MUSCLE_PRESET_LABELS,
  MUSCLE_PRESET_ORDER,
} from './presets';
import { perturbStimulate as perturbMuscleStimulate, perturbCaffeine as perturbCaffeine } from './engine';
import { MUSCLE_QUESTIONS } from './questions';
import type { MuscleState, MuscleDerived, MuscleInputs, MuscleHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<MuscleState, MuscleInputs, MuscleDerived, MuscleHistoryPoint> = {
  config: muscleContractionNativeLoopConfig,
  build: ((ctx: PresentationContext<MuscleState, MuscleDerived, MuscleInputs, MuscleHistoryPoint>) =>
    buildMuscleContractionPresentation(ctx)),
  defaults: DEFAULT_MUSCLE_INPUTS,
  presets: MUSCLE_PRESETS,
  labels: MUSCLE_PRESET_LABELS,
  order: MUSCLE_PRESET_ORDER,
  questions: MUSCLE_QUESTIONS,
  content: muscleContractionContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Stimulate', onPress: () => perturb((s) => perturbMuscleStimulate(s)), variant: 'impulse' },
    { label: 'Caffeine', onPress: () => perturb((s) => perturbCaffeine(s, 0.35)), variant: 'impulse' },
  ],
};
