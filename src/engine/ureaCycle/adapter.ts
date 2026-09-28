import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { ureaCycleContent } from './content';
import { ureaCycleNativeLoopConfig } from './nativeLoopConfig';
import { buildUreaCyclePresentation } from './presentation';
import {
  DEFAULT_UREA_CYCLE_INPUTS,
  UREA_CYCLE_PRESETS,
  UREA_CYCLE_PRESET_GLOSS,
  UREA_CYCLE_PRESET_LABELS,
  UREA_CYCLE_PRESET_ORDER,
} from './presets';
import { UREA_CYCLE_QUESTIONS } from './questions';
import type { UreaCycleDerived, UreaCycleHistoryPoint, UreaCycleInputs, UreaCycleInternalState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<UreaCycleInternalState, UreaCycleInputs, UreaCycleDerived, UreaCycleHistoryPoint> = {
  config: ureaCycleNativeLoopConfig,
  build: ((ctx: PresentationContext<UreaCycleInternalState, UreaCycleDerived, UreaCycleInputs, UreaCycleHistoryPoint>) =>
    buildUreaCyclePresentation(ctx)),
  defaults: DEFAULT_UREA_CYCLE_INPUTS,
  presets: UREA_CYCLE_PRESETS,
  labels: UREA_CYCLE_PRESET_LABELS,
  gloss: UREA_CYCLE_PRESET_GLOSS,
  order: UREA_CYCLE_PRESET_ORDER,
  questions: UREA_CYCLE_QUESTIONS,
  content: ureaCycleContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
