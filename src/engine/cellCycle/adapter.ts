import type { ModuleAdapter } from '../adapterTypes';
import type { PresentationContext } from '../../presentation/types';
import { cellCycleContent } from './content';
import { cellCycleNativeLoopConfig } from './nativeLoopConfig';
import { buildCellCyclePresentation } from './presentation';
import {
  DEFAULT_CELL_CYCLE_INPUTS,
  CELL_CYCLE_PRESETS,
  CELL_CYCLE_PRESET_LABELS,
  CELL_CYCLE_PRESET_ORDER,
} from './presets';
import { CELL_CYCLE_QUESTIONS } from './questions';
import type { CellCycleInternalState, CellCycleDerived, CellCycleInputs, CellCycleHistoryPoint } from './types';

/**
 * How this module is driven on the native side: its loop config, its presets and the
 * perturbation buttons above the diagram.
 *
 * One file per module, loaded on demand through `adapters.generated.ts`. This used to be one
 * entry in a 1,700-line table in `app/module/[id].tsx` that statically imported all 45 engines,
 * so opening any module paid for every module.
 */
export const adapter: ModuleAdapter<CellCycleInternalState, CellCycleInputs, CellCycleDerived, CellCycleHistoryPoint> = {
  config: cellCycleNativeLoopConfig,
  build: ((ctx: PresentationContext<CellCycleInternalState, CellCycleDerived, CellCycleInputs, CellCycleHistoryPoint>) =>
    buildCellCyclePresentation(ctx)),
  defaults: DEFAULT_CELL_CYCLE_INPUTS,
  presets: CELL_CYCLE_PRESETS,
  labels: CELL_CYCLE_PRESET_LABELS,
  order: CELL_CYCLE_PRESET_ORDER,
  questions: CELL_CYCLE_QUESTIONS,
  content: cellCycleContent,
  presetActiveKey: (id: string) => id,
  actions: () => [],
};
