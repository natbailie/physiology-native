import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { neuromuscularJunctionContent } from './content';
import { neuromuscularJunctionNativeLoopConfig } from './nativeLoopConfig';
import { buildNeuromuscularJunctionPresentation } from './presentation';
import {
  DEFAULT_NMJ_INPUTS,
  NMJ_PRESETS,
  NMJ_PRESET_LABELS,
  NMJ_PRESET_ORDER,
} from './presets';
import { perturbTetanicBurst as perturbTetanicBurst, perturbRest as perturbRest } from './engine';
import { NMJ_QUESTIONS } from './questions';
import type { NmjState, NmjDerived, NmjInputs, NmjHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<NmjState, NmjInputs, NmjDerived, NmjHistoryPoint> = {
  config: neuromuscularJunctionNativeLoopConfig,
  build: ((ctx: PresentationContext<NmjState, NmjDerived, NmjInputs, NmjHistoryPoint>) =>
    buildNeuromuscularJunctionPresentation(ctx)),
  defaults: DEFAULT_NMJ_INPUTS,
  presets: NMJ_PRESETS,
  labels: NMJ_PRESET_LABELS,
  order: NMJ_PRESET_ORDER,
  questions: NMJ_QUESTIONS,
  content: neuromuscularJunctionContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Tetanic burst', onPress: () => perturb((s) => perturbTetanicBurst(s)), variant: 'impulse' },
    { label: 'Rest', onPress: () => perturb((s) => perturbRest(s)), variant: 'impulse' },
  ],
};
