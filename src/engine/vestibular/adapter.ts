import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { vestibularNativeLoopConfig } from './nativeLoopConfig';
import { buildVestibularPresentation } from './presentation';
import {
  DEFAULT_VESTIBULAR_INPUTS,
  VESTIBULAR_PRESETS,
  VESTIBULAR_PRESET_LABELS,
  VESTIBULAR_PRESET_ORDER,
} from './presets';
import { perturbPerformHallpike as perturbPerformHallpike, perturbHeadImpulse as perturbHeadImpulse } from './engine';
import { VESTIBULAR_QUESTIONS } from './questions';
import type { VestibularInternalState, VestibularDerived, VestibularInputs, VestibularHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<VestibularInternalState, VestibularInputs, VestibularDerived, VestibularHistoryPoint> = {
  config: vestibularNativeLoopConfig,
  build: ((ctx: PresentationContext<VestibularInternalState, VestibularDerived, VestibularInputs, VestibularHistoryPoint>) =>
    buildVestibularPresentation(ctx)),
  defaults: DEFAULT_VESTIBULAR_INPUTS,
  presets: VESTIBULAR_PRESETS,
  labels: VESTIBULAR_PRESET_LABELS,
  order: VESTIBULAR_PRESET_ORDER,
  questions: VESTIBULAR_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Perform Hallpike', onPress: () => perturb((s) => perturbPerformHallpike(s)), variant: 'impulse' },
    { label: 'Head impulse', onPress: () => perturb((s) => perturbHeadImpulse(s)), variant: 'impulse' },
  ],
};
