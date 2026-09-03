import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { electrolyteBalanceContent } from './content';
import { electrolyteBalanceNativeLoopConfig } from './nativeLoopConfig';
import { buildElectrolyteBalancePresentation } from './presentation';
import {
  DEFAULT_ELECTROLYTE_INPUTS,
  ELECTROLYTE_PRESETS,
  ELECTROLYTE_PRESET_LABELS,
  ELECTROLYTE_PRESET_ORDER,
} from './presets';
import { perturbGiveInsulin as perturbElectrolyteGiveInsulin, perturbSalineBolus as perturbSalineBolus, perturbPotassiumBolus as perturbPotassiumBolus } from './engine';
import { ELECTROLYTE_QUESTIONS } from './questions';
import type { ElectrolyteState, ElectrolyteDerived, ElectrolyteInputs, ElectrolyteHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ElectrolyteState, ElectrolyteInputs, ElectrolyteDerived, ElectrolyteHistoryPoint> = {
  config: electrolyteBalanceNativeLoopConfig,
  build: ((ctx: PresentationContext<ElectrolyteState, ElectrolyteDerived, ElectrolyteInputs, ElectrolyteHistoryPoint>) =>
    buildElectrolyteBalancePresentation(ctx)),
  defaults: DEFAULT_ELECTROLYTE_INPUTS,
  presets: ELECTROLYTE_PRESETS,
  labels: ELECTROLYTE_PRESET_LABELS,
  order: ELECTROLYTE_PRESET_ORDER,
  questions: ELECTROLYTE_QUESTIONS,
  content: electrolyteBalanceContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Give insulin', onPress: () => perturb((s) => perturbElectrolyteGiveInsulin(s, 0.22)), variant: 'impulse' },
    { label: 'Saline bolus', onPress: () => perturb((s) => perturbSalineBolus(s, 1)), variant: 'impulse' },
    { label: 'Potassium bolus', onPress: () => perturb((s) => perturbPotassiumBolus(s, 25)), variant: 'impulse' },
  ],
};
