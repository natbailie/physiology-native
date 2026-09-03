import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { cardiacElectroNativeLoopConfig } from './nativeLoopConfig';
import { buildCardiacElectroPresentation } from './presentation';
import {
  DEFAULT_CARDIAC_INPUTS,
  CARDIAC_PRESETS,
  CARDIAC_PRESET_LABELS,
  PRESET_ORDER as CARDIAC_PRESET_ORDER,
} from './presets';
import { CARDIAC_QUESTIONS } from './questions';
import type { CardiacState, CardiacDerived, CardiacInputs, CardiacHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<CardiacState, CardiacInputs, CardiacDerived, CardiacHistoryPoint> = {
  config: cardiacElectroNativeLoopConfig,
  build: ((ctx: PresentationContext<CardiacState, CardiacDerived, CardiacInputs, CardiacHistoryPoint>) =>
    buildCardiacElectroPresentation(ctx)),
  defaults: DEFAULT_CARDIAC_INPUTS,
  presets: CARDIAC_PRESETS,
  labels: CARDIAC_PRESET_LABELS,
  order: CARDIAC_PRESET_ORDER,
  questions: CARDIAC_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
