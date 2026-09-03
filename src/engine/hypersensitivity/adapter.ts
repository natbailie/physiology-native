import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { hypersensitivityContent } from './content';
import { hypersensitivityNativeLoopConfig } from './nativeLoopConfig';
import { buildHypersensitivityPresentation } from './presentation';
import {
  DEFAULT_HYPERSENSITIVITY_INPUTS,
  HYPERSENSITIVITY_PRESETS,
  HYPERSENSITIVITY_PRESET_LABELS,
  MECHANISM_PRESET_ORDER as HYPERSENSITIVITY_PRESET_ORDER,
} from './presets';
import { perturbChallenge as perturbChallenge, perturbAdrenaline as perturbAdrenaline, perturbTransfuse as perturbTransfuse, perturbDiurese as perturbDiurese } from './engine';
import { HYPERSENSITIVITY_QUESTIONS } from './questions';
import type { HypersensitivityState, HypersensitivityDerived, HypersensitivityInputs, HypersensitivityHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<HypersensitivityState, HypersensitivityInputs, HypersensitivityDerived, HypersensitivityHistoryPoint> = {
  config: hypersensitivityNativeLoopConfig,
  build: ((ctx: PresentationContext<HypersensitivityState, HypersensitivityDerived, HypersensitivityInputs, HypersensitivityHistoryPoint>) =>
    buildHypersensitivityPresentation(ctx)),
  defaults: DEFAULT_HYPERSENSITIVITY_INPUTS,
  presets: HYPERSENSITIVITY_PRESETS,
  labels: HYPERSENSITIVITY_PRESET_LABELS,
  order: HYPERSENSITIVITY_PRESET_ORDER,
  questions: HYPERSENSITIVITY_QUESTIONS,
  content: hypersensitivityContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Challenge', onPress: () => perturb((s) => perturbChallenge(s, 100)), variant: 'impulse' },
    { label: 'Adrenaline', onPress: () => perturb((s) => perturbAdrenaline(s)), variant: 'impulse' },
    { label: 'Transfuse', onPress: () => perturb((s) => perturbTransfuse(s)), variant: 'impulse' },
    { label: 'Diurese', onPress: () => perturb((s) => perturbDiurese(s)), variant: 'impulse' },
  ],
};
