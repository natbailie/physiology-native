import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { motorControlNativeLoopConfig } from './nativeLoopConfig';
import { buildMotorControlPresentation } from './presentation';
import {
  DEFAULT_MOTOR_INPUTS,
  MOTOR_PRESETS,
  MOTOR_PRESET_LABELS,
  MOTOR_PRESET_ORDER,
} from './presets';
import { perturbLevodopaDose as perturbLevodopaDose, perturbToggleDbs as perturbToggleDbs } from './engine';
import { MOTOR_QUESTIONS } from './questions';
import type { MotorInternalState, MotorDerived, MotorInputs, MotorHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<MotorInternalState, MotorInputs, MotorDerived, MotorHistoryPoint> = {
  config: motorControlNativeLoopConfig,
  build: ((ctx: PresentationContext<MotorInternalState, MotorDerived, MotorInputs, MotorHistoryPoint>) =>
    buildMotorControlPresentation(ctx)),
  defaults: DEFAULT_MOTOR_INPUTS,
  presets: MOTOR_PRESETS,
  labels: MOTOR_PRESET_LABELS,
  order: MOTOR_PRESET_ORDER,
  questions: MOTOR_QUESTIONS,
  presetActiveKey: (id: string) => id,
  actions: (inputs, perturb) => [
    { label: 'Levodopa', onPress: () => perturb((s) => perturbLevodopaDose(s)), variant: 'impulse' },
    { label: 'Toggle DBS', onPress: () => perturb((s) => perturbToggleDbs(s)), variant: 'impulse' },
  ],
};
