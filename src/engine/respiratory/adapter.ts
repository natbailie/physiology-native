import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { respiratoryContent } from './content';
import { respiratoryNativeLoopConfig } from './nativeLoopConfig';
import { buildRespiratoryPresentation } from './presentation';
import {
  DEFAULT_RESP_INPUTS,
  RESP_PRESETS,
  RESP_PRESET_LABELS,
  PRESET_ORDER as RESP_PRESET_ORDER,
} from './presets';
import { perturbAirwayObstruction } from './engine';
import { RESPIRATORY_QUESTIONS } from './questions';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<RespState, RespInputs, RespDerived, RespHistoryPoint> = {
  config: respiratoryNativeLoopConfig,
  build: ((ctx: PresentationContext<RespState, RespDerived, RespInputs, RespHistoryPoint>) =>
    buildRespiratoryPresentation(ctx)),
  defaults: DEFAULT_RESP_INPUTS,
  presets: RESP_PRESETS,
  labels: RESP_PRESET_LABELS,
  order: RESP_PRESET_ORDER,
  questions: RESPIRATORY_QUESTIONS,
  content: respiratoryContent,
  presetActiveKey: (id: string) => id,
  actions: (_, perturb) => [
    { label: 'Airway obstruction', onPress: () => perturb((s) => perturbAirwayObstruction(s as RespState)), variant: 'impulse' },
  ],
};
