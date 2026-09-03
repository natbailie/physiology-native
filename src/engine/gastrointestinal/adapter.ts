import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { gastrointestinalContent } from './content';
import { gastrointestinalNativeLoopConfig } from './nativeLoopConfig';
import { buildGastrointestinalPresentation } from './presentation';
import {
  DEFAULT_GI_INPUTS,
  GI_PRESETS,
  GI_PRESET_LABELS,
  PRESET_ORDER as GI_PRESET_ORDER,
} from './presets';
import { perturbEatMeal as perturbGI_EatMeal } from './engine';
import { GI_QUESTIONS } from './questions';
import type { GiState, GiDerived, GiInputs, GiHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<GiState, GiInputs, GiDerived, GiHistoryPoint> = {
  config: gastrointestinalNativeLoopConfig,
  build: ((ctx: PresentationContext<GiState, GiDerived, GiInputs, GiHistoryPoint>) =>
    buildGastrointestinalPresentation(ctx)),
  defaults: DEFAULT_GI_INPUTS,
  presets: GI_PRESETS,
  labels: GI_PRESET_LABELS,
  order: GI_PRESET_ORDER,
  questions: GI_QUESTIONS,
  content: gastrointestinalContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Eat a meal', onPress: () => perturb((s) => perturbGI_EatMeal(s)), variant: 'impulse' },
  ],
};
