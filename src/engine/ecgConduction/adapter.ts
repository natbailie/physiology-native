import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { ecgConductionContent } from './content';
import { ecgConductionNativeLoopConfig } from './nativeLoopConfig';
import { buildEcgConductionPresentation } from './presentation';
import {
  DEFAULT_ECG_INPUTS,
  ECG_PRESETS,
  ECG_PRESET_LABELS,
  PRESET_ORDER as ECG_PRESET_ORDER,
} from './presets';
import { ECG_QUESTIONS } from './questions';
import type { EcgState, EcgDerived, EcgInputs, EcgHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<EcgState, EcgInputs, EcgDerived, EcgHistoryPoint> = {
  config: ecgConductionNativeLoopConfig,
  build: ((ctx: PresentationContext<EcgState, EcgDerived, EcgInputs, EcgHistoryPoint>) =>
    buildEcgConductionPresentation(ctx)),
  defaults: DEFAULT_ECG_INPUTS,
  presets: ECG_PRESETS,
  labels: ECG_PRESET_LABELS,
  order: ECG_PRESET_ORDER,
  questions: ECG_QUESTIONS,
  content: ecgConductionContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
