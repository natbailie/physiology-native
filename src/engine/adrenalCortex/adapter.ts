import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { adrenalCortexNativeLoopConfig } from './nativeLoopConfig';
import { buildAdrenalCortexPresentation } from './presentation';
import {
  DEFAULT_ADRENAL_INPUTS,
  ADRENAL_PRESETS,
  ADRENAL_PRESET_LABELS,
  ADRENAL_PRESET_ORDER,
} from './presets';
import { ADRENAL_QUESTIONS } from './questions';
import type { AdrenalCortexInternalState, AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<AdrenalCortexInternalState, AdrenalCortexInputs, AdrenalCortexDerived, AdrenalCortexHistoryPoint> = {
  config: adrenalCortexNativeLoopConfig,
  build: ((ctx: PresentationContext<AdrenalCortexInternalState, AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexHistoryPoint>) =>
    buildAdrenalCortexPresentation(ctx)),
  defaults: DEFAULT_ADRENAL_INPUTS,
  presets: ADRENAL_PRESETS,
  labels: ADRENAL_PRESET_LABELS,
  order: ADRENAL_PRESET_ORDER,
  questions: ADRENAL_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
