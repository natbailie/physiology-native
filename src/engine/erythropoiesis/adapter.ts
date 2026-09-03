import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { erythropoiesisContent } from './content';
import { erythropoiesisNativeLoopConfig } from './nativeLoopConfig';
import { buildErythropoiesisPresentation } from './presentation';
import {
  DEFAULT_ERYTHRO_INPUTS,
  ERYTHRO_PRESETS,
  ERYTHRO_PRESET_LABELS,
  PRESET_ORDER as ERYTHRO_PRESET_ORDER,
} from './presets';
import { perturbAcuteBloodLoss as perturbAcuteBloodLoss } from './engine';
import { ERYTHROPOIESIS_QUESTIONS } from './questions';
import type { ErythroState, ErythroDerived, ErythroInputs, ErythroHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ErythroState, ErythroInputs, ErythroDerived, ErythroHistoryPoint> = {
  config: erythropoiesisNativeLoopConfig,
  build: ((ctx: PresentationContext<ErythroState, ErythroDerived, ErythroInputs, ErythroHistoryPoint>) =>
    buildErythropoiesisPresentation(ctx)),
  defaults: DEFAULT_ERYTHRO_INPUTS,
  presets: ERYTHRO_PRESETS,
  labels: ERYTHRO_PRESET_LABELS,
  order: ERYTHRO_PRESET_ORDER,
  questions: ERYTHROPOIESIS_QUESTIONS,
  content: erythropoiesisContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Acute blood loss', onPress: () => perturb((s) => perturbAcuteBloodLoss(s, 40)), variant: 'impulse' },
  ],
};
