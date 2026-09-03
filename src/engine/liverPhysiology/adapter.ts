import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { liverPhysiologyNativeLoopConfig } from './nativeLoopConfig';
import { buildLiverPhysiologyPresentation } from './presentation';
import {
  DEFAULT_LIVER_INPUTS,
  LIVER_PRESETS,
  LIVER_PRESET_LABELS,
  LIVER_PRESET_ORDER,
} from './presets';
import { perturbHaemolyticEpisode as perturbHaemolyticEpisode, perturbAlcoholBinge as perturbAlcoholBinge, perturbStentObstruction as perturbStentObstruction } from './engine';
import { LIVER_QUESTIONS } from './questions';
import type { LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<LiverInternalState, LiverInputs, LiverDerived, LiverHistoryPoint> = {
  config: liverPhysiologyNativeLoopConfig,
  build: ((ctx: PresentationContext<LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint>) =>
    buildLiverPhysiologyPresentation(ctx)),
  defaults: DEFAULT_LIVER_INPUTS,
  presets: LIVER_PRESETS,
  labels: LIVER_PRESET_LABELS,
  order: LIVER_PRESET_ORDER,
  questions: LIVER_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Haemolytic episode', onPress: () => perturb((s) => perturbHaemolyticEpisode(s)), variant: 'impulse' },
    { label: 'Alcohol binge', onPress: () => perturb((s) => perturbAlcoholBinge(s)), variant: 'impulse' },
    { label: 'Stent obstruction', onPress: () => perturb((s) => perturbStentObstruction(s)), variant: 'impulse' },
  ],
};
