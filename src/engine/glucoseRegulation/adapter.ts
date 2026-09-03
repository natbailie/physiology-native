import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { glucoseNativeLoopConfig } from './nativeLoopConfig';
import { buildGlucosePresentation } from './presentation';
import {
  DEFAULT_GLUCOSE_INPUTS,
  GLUCOSE_PRESETS,
  GLUCOSE_PRESET_LABELS,
  PRESET_ORDER as GLUCOSE_PRESET_ORDER,
} from './presets';
import { perturbEatMeal, perturbGiveInsulin } from './engine';
import { GLUCOSE_QUESTIONS } from './questions';
import type { GlucoseDerived, GlucoseHistoryPoint, GlucoseInputs, GlucoseState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<GlucoseState, GlucoseInputs, GlucoseDerived, GlucoseHistoryPoint> = {
  config: glucoseNativeLoopConfig,
  build: ((ctx: PresentationContext<GlucoseState, GlucoseDerived, GlucoseInputs, GlucoseHistoryPoint>) =>
    buildGlucosePresentation(ctx)),
  defaults: DEFAULT_GLUCOSE_INPUTS,
  presets: GLUCOSE_PRESETS,
  labels: GLUCOSE_PRESET_LABELS,
  order: GLUCOSE_PRESET_ORDER,
  questions: GLUCOSE_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Eat meal', onPress: () => perturb((s) => perturbEatMeal(s as GlucoseState, (inputs as GlucoseInputs).mealCarbLoadGrams)), variant: 'impulse' },
    { label: 'Give insulin', onPress: () => perturb((s) => perturbGiveInsulin(s as GlucoseState, (inputs as GlucoseInputs).exogenousInsulinUnits)), variant: 'impulse' },
  ],
};
