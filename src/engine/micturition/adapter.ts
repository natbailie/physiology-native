import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { micturitionContent } from './content';
import { micturitionNativeLoopConfig } from './nativeLoopConfig';
import { buildMicturitionPresentation } from './presentation';
import {
  DEFAULT_MICTURITION_INPUTS,
  MICTURITION_PRESETS,
  MICTURITION_PRESET_LABELS,
  MICTURITION_PRESET_ORDER,
} from './presets';
import { MICTURITION_QUESTIONS } from './questions';
import type { MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<MicturitionInternalState, MicturitionInputs, MicturitionDerived, MicturitionHistoryPoint> = {
  config: micturitionNativeLoopConfig,
  build: ((ctx: PresentationContext<MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint>) =>
    buildMicturitionPresentation(ctx)),
  defaults: DEFAULT_MICTURITION_INPUTS,
  presets: MICTURITION_PRESETS,
  labels: MICTURITION_PRESET_LABELS,
  order: MICTURITION_PRESET_ORDER,
  questions: MICTURITION_QUESTIONS,
  content: micturitionContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
