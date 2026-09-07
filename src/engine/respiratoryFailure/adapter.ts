import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { respiratoryFailureContent } from './content';
import { respiratoryFailureNativeLoopConfig } from './nativeLoopConfig';
import { buildRespiratoryFailurePresentation } from './presentation';
import { DEFAULT_RF_INPUTS, RF_PRESETS, RF_PRESET_LABELS, PRESET_ORDER as RF_PRESET_ORDER } from './presets';
import { RF_QUESTIONS } from './questions';
import type { RfState, RfDerived, RfInputs, RfHistoryPoint } from './types';

export const adapter: ModuleAdapter<RfState, RfInputs, RfDerived, RfHistoryPoint> = {
  config: respiratoryFailureNativeLoopConfig,
  build: ((ctx: PresentationContext<RfState, RfDerived, RfInputs, RfHistoryPoint>) =>
    buildRespiratoryFailurePresentation(ctx)),
  defaults: DEFAULT_RF_INPUTS,
  presets: RF_PRESETS,
  labels: RF_PRESET_LABELS,
  order: RF_PRESET_ORDER,
  questions: RF_QUESTIONS,
  content: respiratoryFailureContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};