import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { bloodGroupsContent } from './content';
import { bloodGroupsNativeLoopConfig } from './nativeLoopConfig';
import { buildBloodGroupsPresentation } from './presentation';
import {
  DEFAULT_BLOOD_INPUTS,
  BLOOD_PRESETS,
  BLOOD_PRESET_LABELS,
  BLOOD_PRESET_ORDER,
} from './presets';
import { BLOOD_QUESTIONS } from './questions';
import type { BloodInternalState, BloodDerived, BloodInputs, BloodHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<BloodInternalState, BloodInputs, BloodDerived, BloodHistoryPoint> = {
  config: bloodGroupsNativeLoopConfig,
  build: ((ctx: PresentationContext<BloodInternalState, BloodDerived, BloodInputs, BloodHistoryPoint>) =>
    buildBloodGroupsPresentation(ctx)),
  defaults: DEFAULT_BLOOD_INPUTS,
  presets: BLOOD_PRESETS,
  labels: BLOOD_PRESET_LABELS,
  order: BLOOD_PRESET_ORDER,
  questions: BLOOD_QUESTIONS,
  content: bloodGroupsContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
