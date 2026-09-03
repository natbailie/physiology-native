import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { thermoregulationContent } from './content';
import { thermoregulationNativeLoopConfig } from './nativeLoopConfig';
import { buildThermoregulationPresentation } from './presentation';
import {
  DEFAULT_THERMO_INPUTS,
  THERMO_PRESETS,
  THERMO_PRESET_LABELS,
  THERMO_PRESET_ORDER,
} from './presets';
import { perturbGiveAntipyretic as perturbGiveAntipyretic, perturbActiveCooling as perturbActiveCooling, perturbActiveRewarming as perturbActiveRewarming } from './engine';
import { THERMO_QUESTIONS } from './questions';
import type { ThermoInternalState, ThermoDerived, ThermoInputs, ThermoHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ThermoInternalState, ThermoInputs, ThermoDerived, ThermoHistoryPoint> = {
  config: thermoregulationNativeLoopConfig,
  build: ((ctx: PresentationContext<ThermoInternalState, ThermoDerived, ThermoInputs, ThermoHistoryPoint>) =>
    buildThermoregulationPresentation(ctx)),
  defaults: DEFAULT_THERMO_INPUTS,
  presets: THERMO_PRESETS,
  labels: THERMO_PRESET_LABELS,
  order: THERMO_PRESET_ORDER,
  questions: THERMO_QUESTIONS,
  content: thermoregulationContent,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Antipyretic', onPress: () => perturb((s) => perturbGiveAntipyretic(s)), variant: 'impulse' },
    { label: 'Active cooling', onPress: () => perturb((s) => perturbActiveCooling(s)), variant: 'impulse' },
    { label: 'Active rewarming', onPress: () => perturb((s) => perturbActiveRewarming(s)), variant: 'impulse' },
  ],
};
