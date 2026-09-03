import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { hearingNativeLoopConfig } from './nativeLoopConfig';
import { buildHearingPresentation } from './presentation';
import {
  DEFAULT_HEARING_INPUTS,
  HEARING_PRESETS,
  HEARING_PRESET_LABELS,
  HEARING_PRESET_ORDER,
} from './presets';
import { perturbNoiseExposure as perturbNoiseExposure } from './engine';
import { HEARING_QUESTIONS } from './questions';
import type { HearingInternalState, HearingDerived, HearingInputs, HearingHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<HearingInternalState, HearingInputs, HearingDerived, HearingHistoryPoint> = {
  config: hearingNativeLoopConfig,
  build: ((ctx: PresentationContext<HearingInternalState, HearingDerived, HearingInputs, HearingHistoryPoint>) =>
    buildHearingPresentation(ctx)),
  defaults: DEFAULT_HEARING_INPUTS,
  presets: HEARING_PRESETS,
  labels: HEARING_PRESET_LABELS,
  order: HEARING_PRESET_ORDER,
  questions: HEARING_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Noise exposure', onPress: () => perturb((s) => perturbNoiseExposure(s)), variant: 'impulse' },
  ],
};
