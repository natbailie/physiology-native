import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { calciumHomeostasisNativeLoopConfig } from './nativeLoopConfig';
import { buildCalciumHomeostasisPresentation } from './presentation';
import {
  DEFAULT_CALCIUM_INPUTS,
  CALCIUM_PRESETS,
  CALCIUM_PRESET_LABELS,
  PRESET_ORDER as CALCIUM_PRESET_ORDER,
} from './presets';
import { perturbCalciumInfusion as perturbCalciumInfusion } from './engine';
import { CALCIUM_QUESTIONS } from './questions';
import type { CalciumState, CalciumDerived, CalciumInputs, CalciumHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<CalciumState, CalciumInputs, CalciumDerived, CalciumHistoryPoint> = {
  config: calciumHomeostasisNativeLoopConfig,
  build: ((ctx: PresentationContext<CalciumState, CalciumDerived, CalciumInputs, CalciumHistoryPoint>) =>
    buildCalciumHomeostasisPresentation(ctx)),
  defaults: DEFAULT_CALCIUM_INPUTS,
  presets: CALCIUM_PRESETS,
  labels: CALCIUM_PRESET_LABELS,
  order: CALCIUM_PRESET_ORDER,
  questions: CALCIUM_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Calcium infusion', onPress: () => perturb((s) => perturbCalciumInfusion(s, 25)), variant: 'impulse' },
  ],
};
