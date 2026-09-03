import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { adrenalMedullaContent } from './content';
import { adrenalMedullaNativeLoopConfig } from './nativeLoopConfig';
import { buildAdrenalMedullaPresentation } from './presentation';
import {
  DEFAULT_MEDULLA_INPUTS,
  MEDULLA_PRESETS,
  MEDULLA_PRESET_LABELS,
  MEDULLA_PRESET_ORDER,
} from './presets';
import { perturbParoxysm as perturbParoxysm } from './engine';
import { MEDULLA_QUESTIONS } from './questions';
import type { MedullaInternalState, MedullaDerived, MedullaInputs, MedullaHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<MedullaInternalState, MedullaInputs, MedullaDerived, MedullaHistoryPoint> = {
  config: adrenalMedullaNativeLoopConfig,
  build: ((ctx: PresentationContext<MedullaInternalState, MedullaDerived, MedullaInputs, MedullaHistoryPoint>) =>
    buildAdrenalMedullaPresentation(ctx)),
  defaults: DEFAULT_MEDULLA_INPUTS,
  presets: MEDULLA_PRESETS,
  labels: MEDULLA_PRESET_LABELS,
  order: MEDULLA_PRESET_ORDER,
  questions: MEDULLA_QUESTIONS,
  content: adrenalMedullaContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Paroxysm', onPress: () => perturb((s) => perturbParoxysm(s)), variant: 'impulse' },
  ],
};
