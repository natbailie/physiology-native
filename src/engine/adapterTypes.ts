import type { ModulePresentation, PresentationContext } from '../presentation/types';
import type { NativeLoopConfig } from '../hooks/useNativeEngineLoop';
import type { ModuleQuestion } from '../shared/assessment/types';
import type { ExplainerContent } from '../shared/explainer/types';

/**
 * How one module is driven on the native side.
 *
 * The engine, the presentation schema and the question bank are all file-synced from the web
 * project; what is NOT shared is the wiring between them — which loop config to run, which
 * presets the scenario bar offers, and which perturbations get a button. The web states that per
 * module inside each `<Name>Page.tsx`; this is the native equivalent, one `adapter.ts` per module
 * directory.
 *
 * `title` and `accent` are deliberately absent. They live in the file-synced
 * `home/moduleRegistry.ts`, which is the catalogue's single source of truth, and restating them
 * here is what let the two drift.
 */
export interface ModuleAdapter<TState, TInputs, TDerived, THistoryPoint> {
  config: NativeLoopConfig<TState, TInputs, TDerived, THistoryPoint>;
  build: (
    ctx: PresentationContext<TState, TDerived, TInputs, THistoryPoint>,
  ) => ModulePresentation<TState, TDerived, TInputs, THistoryPoint>;
  defaults: TInputs;
  presets: Record<string, Partial<TInputs>>;
  labels: Record<string, string>;
  order: string[];
  settleOverrides?: Record<string, number>;
  /**
   * The module's authored question bank.
   *
   * `ModuleQuestion` is generic over the module's preset union and its snapshot type, neither of
   * which the adapter carries — `presets` and `order` have already erased the preset union to
   * `string`. So they are erased here too, which is what `PracticePanel` does at the same
   * boundary for the same reason.
   */
   
  questions: readonly ModuleQuestion<any, any, any>[];
  /**
   * The module's explainer prose, file-synced from the web project's `content.ts`.
   *
   * It reaches the adapter rather than the screen because the export name is per module
   * (`cardiorenalContent`, `shockStatesContent`), which is exactly the variance an adapter exists
   * to absorb.
   */
  content: ExplainerContent;
  presetActiveKey: (id: string) => string;
  actions: (
    inputs: TInputs,
    perturb: (fn: (state: TState) => TState) => void,
  ) => { label: string; onPress: () => void; variant: 'impulse' }[];
}

/** An adapter whose type parameters have been erased, as the screen sees it after loading. */
export type AnyModuleAdapter = ModuleAdapter<unknown, unknown, unknown, unknown>;
