import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { digestionAbsorptionNativeLoopConfig } from './nativeLoopConfig';
import { buildDigestionAbsorptionPresentation } from './presentation';
import {
  DEFAULT_DIGESTION_INPUTS,
  DIGESTION_PRESETS,
  DIGESTION_PRESET_LABELS,
  DIGESTION_PRESET_ORDER,
} from './presets';
import { perturbEatMeal as perturbDigest_EatMeal } from './engine';
import { DIGESTION_QUESTIONS } from './questions';
import type { DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<DigestionInternalState, DigestionInputs, DigestionDerived, DigestionHistoryPoint> = {
  config: digestionAbsorptionNativeLoopConfig,
  build: ((ctx: PresentationContext<DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint>) =>
    buildDigestionAbsorptionPresentation(ctx)),
  defaults: DEFAULT_DIGESTION_INPUTS,
  presets: DIGESTION_PRESETS,
  labels: DIGESTION_PRESET_LABELS,
  order: DIGESTION_PRESET_ORDER,
  questions: DIGESTION_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Eat a meal', onPress: () => perturb((s) => perturbDigest_EatMeal(s)), variant: 'impulse' },
  ],
};
