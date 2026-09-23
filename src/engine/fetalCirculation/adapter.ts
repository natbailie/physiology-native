import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { fetalCirculationContent } from './content';
import { fetalCirculationNativeLoopConfig } from './nativeLoopConfig';
import { buildFetalCirculationPresentation } from './presentation';
import {
  DEFAULT_FETAL_INPUTS,
  FETAL_PRESETS,
  FETAL_PRESET_LABELS,
  FETAL_PRESET_ORDER,
  FETAL_PRESET_SETTLE_SECONDS,
} from './presets';
import { perturbFirstBreath } from './engine';
import { FETAL_QUESTIONS } from './questions';
import type { FetalState, FetalDerived, FetalInputs, FetalHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<FetalState, FetalInputs, FetalDerived, FetalHistoryPoint> = {
  config: fetalCirculationNativeLoopConfig,
  build: ((ctx: PresentationContext<FetalState, FetalDerived, FetalInputs, FetalHistoryPoint>) =>
    buildFetalCirculationPresentation(ctx)),
  defaults: DEFAULT_FETAL_INPUTS,
  presets: FETAL_PRESETS,
  labels: FETAL_PRESET_LABELS,
  order: FETAL_PRESET_ORDER,
  questions: FETAL_QUESTIONS,
  settleOverrides: FETAL_PRESET_SETTLE_SECONDS,
  content: fetalCirculationContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb, nudge) => [
    { label: 'First breath', onPress: () => perturb((s) => perturbFirstBreath(s)), variant: 'impulse' },
    // A duct is held open BY prostaglandin, for as long as the infusion runs.
    { label: 'Reopen duct', onPress: () => nudge({ prostaglandinLevel: 60 }), variant: 'impulse' },
  ],
};
