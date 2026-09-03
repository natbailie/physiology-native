import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { respiratoryMechanicsContent } from './content';
import { respiratoryMechanicsNativeLoopConfig } from './nativeLoopConfig';
import { buildRespiratoryMechanicsPresentation } from './presentation';
import {
  DEFAULT_RESP_MECH_INPUTS,
  RESP_MECH_PRESETS,
  RESP_MECH_PRESET_LABELS,
  PRESET_ORDER as RESP_MECH_PRESET_ORDER,
} from './presets';
import { perturbFvcManeuver as perturbFvcManeuver } from './engine';
import { RESP_MECH_QUESTIONS } from './questions';
import type { RespMechState, RespMechDerived, RespMechInputs, RespMechHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<RespMechState, RespMechInputs, RespMechDerived, RespMechHistoryPoint> = {
  config: respiratoryMechanicsNativeLoopConfig,
  build: ((ctx: PresentationContext<RespMechState, RespMechDerived, RespMechInputs, RespMechHistoryPoint>) =>
    buildRespiratoryMechanicsPresentation(ctx)),
  defaults: DEFAULT_RESP_MECH_INPUTS,
  presets: RESP_MECH_PRESETS,
  labels: RESP_MECH_PRESET_LABELS,
  order: RESP_MECH_PRESET_ORDER,
  questions: RESP_MECH_QUESTIONS,
  content: respiratoryMechanicsContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'FVC manoeuvre', onPress: () => perturb((s) => perturbFvcManeuver(s)), variant: 'impulse' },
  ],
};
