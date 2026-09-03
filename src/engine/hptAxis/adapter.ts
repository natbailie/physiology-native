import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { hptAxisContent } from './content';
import { hptAxisNativeLoopConfig } from './nativeLoopConfig';
import { buildHptPresentation } from './presentation';
import {
  DEFAULT_HPT_INPUTS,
  HPT_PRESETS,
  HPT_PRESET_LABELS,
  PRESET_ORDER as HPT_PRESET_ORDER,
} from './presets';
import { perturbAcuteIllness as perturbAcuteIllness } from './engine';
import { HPT_QUESTIONS } from './questions';
import type { HptState, HptDerived, HptInputs, HptHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<HptState, HptInputs, HptDerived, HptHistoryPoint> = {
  config: hptAxisNativeLoopConfig,
  build: ((ctx: PresentationContext<HptState, HptDerived, HptInputs, HptHistoryPoint>) =>
    buildHptPresentation(ctx)),
  defaults: DEFAULT_HPT_INPUTS,
  presets: HPT_PRESETS,
  labels: HPT_PRESET_LABELS,
  order: HPT_PRESET_ORDER,
  questions: HPT_QUESTIONS,
  content: hptAxisContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Acute illness', onPress: () => perturb((s) => perturbAcuteIllness(s, 1)), variant: 'impulse' },
  ],
};
