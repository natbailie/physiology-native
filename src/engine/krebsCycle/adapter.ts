import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { krebsCycleContent } from './content';
import { krebsCycleNativeLoopConfig } from './nativeLoopConfig';
import { buildKrebsCyclePresentation } from './presentation';
import {
  DEFAULT_KREBS_CYCLE_INPUTS,
  KREBS_CYCLE_PRESETS,
  KREBS_CYCLE_PRESET_GLOSS,
  KREBS_CYCLE_PRESET_LABELS,
  KREBS_CYCLE_PRESET_ORDER,
} from './presets';
import { KREBS_CYCLE_QUESTIONS } from './questions';
import type { KrebsCycleDerived, KrebsCycleHistoryPoint, KrebsCycleInputs, KrebsCycleInternalState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<KrebsCycleInternalState, KrebsCycleInputs, KrebsCycleDerived, KrebsCycleHistoryPoint> = {
  config: krebsCycleNativeLoopConfig,
  build: ((ctx: PresentationContext<KrebsCycleInternalState, KrebsCycleDerived, KrebsCycleInputs, KrebsCycleHistoryPoint>) =>
    buildKrebsCyclePresentation(ctx)),
  defaults: DEFAULT_KREBS_CYCLE_INPUTS,
  presets: KREBS_CYCLE_PRESETS,
  labels: KREBS_CYCLE_PRESET_LABELS,
  gloss: KREBS_CYCLE_PRESET_GLOSS,
  order: KREBS_CYCLE_PRESET_ORDER,
  questions: KREBS_CYCLE_QUESTIONS,
  content: krebsCycleContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
