import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { toxicologyContent } from './content';
import { toxicologyNativeLoopConfig } from './nativeLoopConfig';
import { buildToxicologyPresentation } from './presentation';
import {
  DEFAULT_TOXICOLOGY_INPUTS,
  TOXICOLOGY_PRESETS,
  TOXICOLOGY_PRESET_LABELS,
  TOXICOLOGY_PRESET_ORDER,
} from './presets';
import { TOXICOLOGY_QUESTIONS } from './questions';
import type { ToxicologyDerived, ToxicologyHistoryPoint, ToxicologyInputs, ToxicologyInternalState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ToxicologyInternalState, ToxicologyInputs, ToxicologyDerived, ToxicologyHistoryPoint> = {
  config: toxicologyNativeLoopConfig,
  build: ((ctx: PresentationContext<ToxicologyInternalState, ToxicologyDerived, ToxicologyInputs, ToxicologyHistoryPoint>) =>
    buildToxicologyPresentation(ctx)),
  defaults: DEFAULT_TOXICOLOGY_INPUTS,
  presets: TOXICOLOGY_PRESETS,
  labels: TOXICOLOGY_PRESET_LABELS,
  order: TOXICOLOGY_PRESET_ORDER,
  questions: TOXICOLOGY_QUESTIONS,
  content: toxicologyContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};