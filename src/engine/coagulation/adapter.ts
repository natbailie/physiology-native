import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { coagulationNativeLoopConfig } from './nativeLoopConfig';
import { buildCoagulationPresentation } from './presentation';
import {
  DEFAULT_COAG_INPUTS,
  COAG_PRESETS,
  COAG_PRESET_LABELS,
  PRESET_ORDER as COAG_PRESET_ORDER,
} from './presets';
import { perturbInjury as perturbInjury } from './engine';
import { COAGULATION_QUESTIONS } from './questions';
import type { CoagState, CoagDerived, CoagInputs, CoagHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<CoagState, CoagInputs, CoagDerived, CoagHistoryPoint> = {
  config: coagulationNativeLoopConfig,
  build: ((ctx: PresentationContext<CoagState, CoagDerived, CoagInputs, CoagHistoryPoint>) =>
    buildCoagulationPresentation(ctx)),
  defaults: DEFAULT_COAG_INPUTS,
  presets: COAG_PRESETS,
  labels: COAG_PRESET_LABELS,
  order: COAG_PRESET_ORDER,
  questions: COAGULATION_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Injury', onPress: () => perturb((s) => perturbInjury(s, 1)), variant: 'impulse' },
  ],
};
