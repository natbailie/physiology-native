import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { hpgAxisContent } from './content';
import { hpgAxisNativeLoopConfig } from './nativeLoopConfig';
import { buildHpgPresentation } from './presentation';
import {
  DEFAULT_HPG_INPUTS,
  HPG_PRESETS,
  HPG_PRESET_LABELS,
  PRESET_ORDER as HPG_PRESET_ORDER,
} from './presets';
import { HPG_QUESTIONS } from './questions';
import type { HpgState, HpgDerived, HpgInputs, HpgHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<HpgState, HpgInputs, HpgDerived, HpgHistoryPoint> = {
  config: hpgAxisNativeLoopConfig,
  build: ((ctx: PresentationContext<HpgState, HpgDerived, HpgInputs, HpgHistoryPoint>) =>
    buildHpgPresentation(ctx)),
  defaults: DEFAULT_HPG_INPUTS,
  presets: HPG_PRESETS,
  labels: HPG_PRESET_LABELS,
  order: HPG_PRESET_ORDER,
  questions: HPG_QUESTIONS,
  content: hpgAxisContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
