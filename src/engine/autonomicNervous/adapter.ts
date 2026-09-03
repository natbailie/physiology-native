import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { autonomicNervousNativeLoopConfig } from './nativeLoopConfig';
import { buildAutonomicNervousPresentation } from './presentation';
import {
  DEFAULT_ANS_INPUTS,
  ANS_PRESETS,
  ANS_PRESET_LABELS,
  PRESET_ORDER as ANS_PRESET_ORDER,
} from './presets';
import { ANS_QUESTIONS } from './questions';
import type { AnsState, AnsDerived, AnsInputs, AnsHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<AnsState, AnsInputs, AnsDerived, AnsHistoryPoint> = {
  config: autonomicNervousNativeLoopConfig,
  build: ((ctx: PresentationContext<AnsState, AnsDerived, AnsInputs, AnsHistoryPoint>) =>
    buildAutonomicNervousPresentation(ctx)),
  defaults: DEFAULT_ANS_INPUTS,
  presets: ANS_PRESETS,
  labels: ANS_PRESET_LABELS,
  order: ANS_PRESET_ORDER,
  questions: ANS_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
