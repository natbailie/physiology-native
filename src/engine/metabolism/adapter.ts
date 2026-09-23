import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { metabolismContent } from './content';
import { metabolismNativeLoopConfig } from './nativeLoopConfig';
import { buildMetabolismPresentation } from './presentation';
import {
  DEFAULT_METABOLISM_INPUTS,
  METABOLISM_PRESETS,
  METABOLISM_PRESET_LABELS,
  METABOLISM_PRESET_ORDER,
} from './presets';
import { METABOLISM_QUESTIONS } from './questions';
import type { MetabolismDerived, MetabolismHistoryPoint, MetabolismInputs, MetabolismInternalState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<MetabolismInternalState, MetabolismInputs, MetabolismDerived, MetabolismHistoryPoint> = {
  config: metabolismNativeLoopConfig,
  build: ((ctx: PresentationContext<MetabolismInternalState, MetabolismDerived, MetabolismInputs, MetabolismHistoryPoint>) =>
    buildMetabolismPresentation(ctx)),
  defaults: DEFAULT_METABOLISM_INPUTS,
  presets: METABOLISM_PRESETS,
  labels: METABOLISM_PRESET_LABELS,
  order: METABOLISM_PRESET_ORDER,
  questions: METABOLISM_QUESTIONS,
  content: metabolismContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};