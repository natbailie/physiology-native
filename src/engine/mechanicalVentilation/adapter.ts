import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { mechanicalVentilationContent } from './content';
import { mechanicalVentilationNativeLoopConfig } from './nativeLoopConfig';
import { buildMechanicalVentilationPresentation } from './presentation';
import { DEFAULT_MV_INPUTS, MV_PRESETS, MV_PRESET_LABELS, PRESET_ORDER as MV_PRESET_ORDER } from './presets';
import { MV_QUESTIONS } from './questions';
import type { MvState, MvDerived, MvInputs, MvHistoryPoint } from './types';

export const adapter: ModuleAdapter<MvState, MvInputs, MvDerived, MvHistoryPoint> = {
  config: mechanicalVentilationNativeLoopConfig,
  build: ((ctx: PresentationContext<MvState, MvDerived, MvInputs, MvHistoryPoint>) =>
    buildMechanicalVentilationPresentation(ctx)),
  defaults: DEFAULT_MV_INPUTS,
  presets: MV_PRESETS,
  labels: MV_PRESET_LABELS,
  order: MV_PRESET_ORDER,
  questions: MV_QUESTIONS,
  content: mechanicalVentilationContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};