import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { cardiorenalNativeLoopConfig } from './nativeLoopConfig';
import { buildCardiorenalPresentation } from './presentation';
import {
  DEFAULT_INPUTS as CARDIORENAL_DEFAULTS,
  PRESETS as CARDIORENAL_PRESETS,
  PRESET_LABELS as CARDIORENAL_PRESET_LABELS,
  PRESET_ORDER as CARDIORENAL_PRESET_ORDER,
} from './presets';
import { perturbBloodVolume } from './engine';
import { CARDIORENAL_QUESTIONS } from './questions';
import type { DerivedValues, HistoryPoint, SimInputs, SimState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<SimState, SimInputs, DerivedValues, HistoryPoint> = {
  config: cardiorenalNativeLoopConfig,
  build: ((ctx: PresentationContext<SimState, DerivedValues, SimInputs, HistoryPoint>) =>
    buildCardiorenalPresentation(ctx)),
  defaults: CARDIORENAL_DEFAULTS,
  presets: CARDIORENAL_PRESETS,
  labels: CARDIORENAL_PRESET_LABELS,
  order: CARDIORENAL_PRESET_ORDER,
  questions: CARDIORENAL_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (_, perturb) => [
    { label: 'Haemorrhage', onPress: () => perturb((s) => perturbBloodVolume(s as SimState, 0.7)), variant: 'impulse' },
  ],
};
