import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { shockStatesContent } from './content';
import { diagramClasses } from './diagramClasses';
import { shockStatesNativeLoopConfig } from './nativeLoopConfig';
import { buildShockStatesPresentation } from './presentation';
import {
  DEFAULT_SHOCK_INPUTS,
  SHOCK_PRESETS,
  SHOCK_PRESET_LABELS,
  SHOCK_PRESET_GLOSS,
  SHOCK_PRESET_ORDER,
} from './presets';
import { SHOCK_QUESTIONS } from './questions';
import type { ShockState, ShockDerived, ShockInputs, ShockHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<ShockState, ShockInputs, ShockDerived, ShockHistoryPoint> = {
  config: shockStatesNativeLoopConfig,
  build: ((ctx: PresentationContext<ShockState, ShockDerived, ShockInputs, ShockHistoryPoint>) =>
    buildShockStatesPresentation(ctx)),
  defaults: DEFAULT_SHOCK_INPUTS,
  presets: SHOCK_PRESETS,
  labels: SHOCK_PRESET_LABELS,
  gloss: SHOCK_PRESET_GLOSS,
  order: SHOCK_PRESET_ORDER,
  questions: SHOCK_QUESTIONS,
  content: shockStatesContent,
  diagramClasses,
  presetActiveKey: (id: string) => id,
  // A litre in or out moves the blood-volume slider, not a hidden offset behind it.
  actions: (inputs, perturb, nudge) => [
    { label: 'Haemorrhage', onPress: () => nudge({ bloodVolumeMl: -1000 }), variant: 'danger' },
    { label: 'Fluid bolus', onPress: () => nudge({ bloodVolumeMl: 1000 }), variant: 'impulse' },
  ],
};
