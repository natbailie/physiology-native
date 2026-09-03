import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { membranePotentialsContent } from './content';
import { membranePotentialsNativeLoopConfig } from './nativeLoopConfig';
import { buildMembranePotentialsPresentation } from './presentation';
import {
  DEFAULT_MEMBRANE_INPUTS,
  MEMBRANE_PRESETS,
  MEMBRANE_PRESET_LABELS,
  PRESET_ORDER as MEMBRANE_PRESET_ORDER,
} from './presets';
import { perturbStimulate as perturbMembraneStimulate } from './engine';
import { MEMBRANE_QUESTIONS } from './questions';
import type { MembraneState, MembraneDerived, MembraneInputs, MembraneHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<MembraneState, MembraneInputs, MembraneDerived, MembraneHistoryPoint> = {
  config: membranePotentialsNativeLoopConfig,
  build: ((ctx: PresentationContext<MembraneState, MembraneDerived, MembraneInputs, MembraneHistoryPoint>) =>
    buildMembranePotentialsPresentation(ctx)),
  defaults: DEFAULT_MEMBRANE_INPUTS,
  presets: MEMBRANE_PRESETS,
  labels: MEMBRANE_PRESET_LABELS,
  order: MEMBRANE_PRESET_ORDER,
  questions: MEMBRANE_QUESTIONS,
  content: membranePotentialsContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Stimulate', onPress: () => perturb((s) => perturbMembraneStimulate(s, 1)), variant: 'impulse' },
  ],
};
