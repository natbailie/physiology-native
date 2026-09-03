import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { coronaryCirculationContent } from './content';
import { coronaryCirculationNativeLoopConfig } from './nativeLoopConfig';
import { buildCoronaryCirculationPresentation } from './presentation';
import {
  DEFAULT_CORONARY_INPUTS,
  CORONARY_PRESETS,
  CORONARY_PRESET_LABELS,
  CORONARY_PRESET_ORDER,
} from './presets';
import { perturbExertion as perturbExertion, perturbVasospasm as perturbVasospasm } from './engine';
import { CORONARY_QUESTIONS } from './questions';
import type { CoronaryInternalState, CoronaryDerived, CoronaryInputs, CoronaryHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<CoronaryInternalState, CoronaryInputs, CoronaryDerived, CoronaryHistoryPoint> = {
  config: coronaryCirculationNativeLoopConfig,
  build: ((ctx: PresentationContext<CoronaryInternalState, CoronaryDerived, CoronaryInputs, CoronaryHistoryPoint>) =>
    buildCoronaryCirculationPresentation(ctx)),
  defaults: DEFAULT_CORONARY_INPUTS,
  presets: CORONARY_PRESETS,
  labels: CORONARY_PRESET_LABELS,
  order: CORONARY_PRESET_ORDER,
  questions: CORONARY_QUESTIONS,
  content: coronaryCirculationContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Exertion', onPress: () => perturb((s) => perturbExertion(s)), variant: 'impulse' },
    { label: 'Coronary vasospasm', onPress: () => perturb((s) => perturbVasospasm(s)), variant: 'impulse' },
  ],
};
