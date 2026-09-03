import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { enzymeKineticsNativeLoopConfig } from './nativeLoopConfig';
import { buildEnzymeKineticsPresentation } from './presentation';
import {
  DEFAULT_KINETICS_INPUTS,
  KINETICS_PRESETS,
  KINETICS_PRESET_LABELS,
  KINETICS_PRESET_ORDER,
} from './presets';
import { KINETICS_QUESTIONS } from './questions';
import type { KineticsInternalState, KineticsDerived, KineticsInputs, KineticsHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<KineticsInternalState, KineticsInputs, KineticsDerived, KineticsHistoryPoint> = {
  config: enzymeKineticsNativeLoopConfig,
  build: ((ctx: PresentationContext<KineticsInternalState, KineticsDerived, KineticsInputs, KineticsHistoryPoint>) =>
    buildEnzymeKineticsPresentation(ctx)),
  defaults: DEFAULT_KINETICS_INPUTS,
  presets: KINETICS_PRESETS,
  labels: KINETICS_PRESET_LABELS,
  order: KINETICS_PRESET_ORDER,
  questions: KINETICS_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
