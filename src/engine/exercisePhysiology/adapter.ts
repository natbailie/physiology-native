import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { exercisePhysiologyContent } from './content';
import { exercisePhysiologyNativeLoopConfig } from './nativeLoopConfig';
import { buildExercisePhysiologyPresentation } from './presentation';
import {
  DEFAULT_EXERCISE_INPUTS,
  EXERCISE_PRESETS,
  EXERCISE_PRESET_LABELS,
  EXERCISE_PRESET_ORDER,
} from './presets';
import { perturbSprintSurge as perturbSprintSurge } from './engine';
import { EXERCISE_QUESTIONS } from './questions';
import type { ExerciseInternalState, ExerciseDerived, ExerciseInputs, ExerciseHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ExerciseInternalState, ExerciseInputs, ExerciseDerived, ExerciseHistoryPoint> = {
  config: exercisePhysiologyNativeLoopConfig,
  build: ((ctx: PresentationContext<ExerciseInternalState, ExerciseDerived, ExerciseInputs, ExerciseHistoryPoint>) =>
    buildExercisePhysiologyPresentation(ctx)),
  defaults: DEFAULT_EXERCISE_INPUTS,
  presets: EXERCISE_PRESETS,
  labels: EXERCISE_PRESET_LABELS,
  order: EXERCISE_PRESET_ORDER,
  questions: EXERCISE_QUESTIONS,
  content: exercisePhysiologyContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Sprint surge', onPress: () => perturb((s) => perturbSprintSurge(s)), variant: 'impulse' },
  ],
};
