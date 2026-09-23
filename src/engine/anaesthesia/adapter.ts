import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { anaesthesiaContent } from './content';
import { anaesthesiaNativeLoopConfig } from './nativeLoopConfig';
import { buildAnaesthesiaPresentation } from './presentation';
import {
  DEFAULT_ANAESTHESIA_INPUTS,
  ANAESTHESIA_PRESETS,
  ANAESTHESIA_PRESET_LABELS,
  ANAESTHESIA_PRESET_ORDER,
} from './presets';
import { ANAESTHESIA_QUESTIONS } from './questions';
import type { AnaesthesiaDerived, AnaesthesiaHistoryPoint, AnaesthesiaInputs, AnaesthesiaInternalState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<AnaesthesiaInternalState, AnaesthesiaInputs, AnaesthesiaDerived, AnaesthesiaHistoryPoint> = {
  config: anaesthesiaNativeLoopConfig,
  build: ((ctx: PresentationContext<AnaesthesiaInternalState, AnaesthesiaDerived, AnaesthesiaInputs, AnaesthesiaHistoryPoint>) =>
    buildAnaesthesiaPresentation(ctx)),
  defaults: DEFAULT_ANAESTHESIA_INPUTS,
  presets: ANAESTHESIA_PRESETS,
  labels: ANAESTHESIA_PRESET_LABELS,
  order: ANAESTHESIA_PRESET_ORDER,
  questions: ANAESTHESIA_QUESTIONS,
  content: anaesthesiaContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};