import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { hpaAxisNativeLoopConfig } from './nativeLoopConfig';
import { buildHpaPresentation } from './presentation';
import {
  DEFAULT_HPA_INPUTS,
  HPA_PRESETS,
  HPA_PRESET_LABELS,
  PRESET_ORDER as HPA_PRESET_ORDER,
} from './presets';
import { perturbAcuteStressor as perturbAcuteStressor } from './engine';
import { HPA_QUESTIONS } from './questions';
import type { HpaState, HpaDerived, HpaInputs, HpaHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<HpaState, HpaInputs, HpaDerived, HpaHistoryPoint> = {
  config: hpaAxisNativeLoopConfig,
  build: ((ctx: PresentationContext<HpaState, HpaDerived, HpaInputs, HpaHistoryPoint>) =>
    buildHpaPresentation(ctx)),
  defaults: DEFAULT_HPA_INPUTS,
  presets: HPA_PRESETS,
  labels: HPA_PRESET_LABELS,
  order: HPA_PRESET_ORDER,
  questions: HPA_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Acute stressor', onPress: () => perturb((s) => perturbAcuteStressor(s, 110)), variant: 'impulse' },
  ],
};
