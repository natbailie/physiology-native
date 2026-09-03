import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { inflammationNativeLoopConfig } from './nativeLoopConfig';
import { buildInflammationPresentation } from './presentation';
import {
  DEFAULT_INFLAMMATION_INPUTS,
  INFLAMMATION_PRESETS,
  INFLAMMATION_PRESET_LABELS,
  INFLAMMATION_PRESET_ORDER,
} from './presets';
import { perturbNewInsult as perturbNewInsult, perturbDrainAbscess as perturbDrainAbscess } from './engine';
import { INFLAMMATION_QUESTIONS } from './questions';
import type { InflammationInternalState, InflammationDerived, InflammationInputs, InflammationHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<InflammationInternalState, InflammationInputs, InflammationDerived, InflammationHistoryPoint> = {
  config: inflammationNativeLoopConfig,
  build: ((ctx: PresentationContext<InflammationInternalState, InflammationDerived, InflammationInputs, InflammationHistoryPoint>) =>
    buildInflammationPresentation(ctx)),
  defaults: DEFAULT_INFLAMMATION_INPUTS,
  presets: INFLAMMATION_PRESETS,
  labels: INFLAMMATION_PRESET_LABELS,
  order: INFLAMMATION_PRESET_ORDER,
  questions: INFLAMMATION_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'New insult', onPress: () => perturb((s) => perturbNewInsult(s, 50)), variant: 'impulse' },
    { label: 'Drain abscess', onPress: () => perturb((s) => perturbDrainAbscess(s, 0.8)), variant: 'impulse' },
  ],
};
