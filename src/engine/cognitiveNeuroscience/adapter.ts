import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { cognitionContent } from './content';
import { cognitionNativeLoopConfig } from './nativeLoopConfig';
import { buildCognitionPresentation } from './presentation';
import {
  DEFAULT_COGNITION_INPUTS,
  COGNITION_PRESETS,
  COGNITION_PRESET_LABELS,
  COGNITION_PRESET_ORDER,
} from './presets';
import { COGNITION_QUESTIONS } from './questions';
import type { CognitionDerived, CognitionHistoryPoint, CognitionInputs, CognitionInternalState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`.
 */
export const adapter: ModuleAdapter<CognitionInternalState, CognitionInputs, CognitionDerived, CognitionHistoryPoint> = {
  config: cognitionNativeLoopConfig,
  build: ((ctx: PresentationContext<CognitionInternalState, CognitionDerived, CognitionInputs, CognitionHistoryPoint>) =>
    buildCognitionPresentation(ctx)),
  defaults: DEFAULT_COGNITION_INPUTS,
  presets: COGNITION_PRESETS,
  labels: COGNITION_PRESET_LABELS,
  order: COGNITION_PRESET_ORDER,
  questions: COGNITION_QUESTIONS,
  content: cognitionContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};