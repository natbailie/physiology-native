import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { visionContent } from './content';
import { visionNativeLoopConfig } from './nativeLoopConfig';
import { buildVisionPresentation } from './presentation';
import {
  DEFAULT_VISION_INPUTS,
  VISION_PRESETS,
  VISION_PRESET_LABELS,
  VISION_PRESET_ORDER,
} from './presets';
import { perturbLightsOut as perturbLightsOut, perturbBrightGlare as perturbBrightGlare, perturbShineTorch as perturbShineTorch, perturbTorchOff as perturbTorchOff } from './engine';
import { VISION_QUESTIONS } from './questions';
import type { VisionInternalState, VisionDerived, VisionInputs, VisionHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<VisionInternalState, VisionInputs, VisionDerived, VisionHistoryPoint> = {
  config: visionNativeLoopConfig,
  build: ((ctx: PresentationContext<VisionInternalState, VisionDerived, VisionInputs, VisionHistoryPoint>) =>
    buildVisionPresentation(ctx)),
  defaults: DEFAULT_VISION_INPUTS,
  presets: VISION_PRESETS,
  labels: VISION_PRESET_LABELS,
  order: VISION_PRESET_ORDER,
  questions: VISION_QUESTIONS,
  content: visionContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Lights out', onPress: () => perturb((s) => perturbLightsOut(s)), variant: 'impulse' },
    { label: 'Bright glare', onPress: () => perturb((s) => perturbBrightGlare(s)), variant: 'impulse' },
    { label: 'Shine torch', onPress: () => perturb((s) => perturbShineTorch(s, 1)), variant: 'impulse' },
    { label: 'Torch off', onPress: () => perturb((s) => perturbTorchOff(s)), variant: 'impulse' },
  ],
};
