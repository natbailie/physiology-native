import type { ModulePresentation, PresentationContext } from '../presentation/types';
import type { NativeLoopConfig } from '../hooks/useNativeEngineLoop';
import type { ModuleQuestion } from '../shared/assessment/types';
import type { ExplainerContent } from '../shared/explainer/types';
import type { DiagramClasses } from '../presentation/diagramClassTypes';

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
  /**
   * One line per scenario saying what it IS, for the options of a pattern question.
   *
   * Sparse on purpose: only the modules that ask pattern questions have one, and a module may
   * gloss more scenarios than it offers. It reaches the adapter rather than the screen for the
   * same reason `labels` does — the export name is per module, and that is exactly the variance
   * an adapter absorbs. The web passes the same constant into `useModuleCases`.
   */
  gloss?: Record<string, string>;
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
  /**
   * This module's diagram classes, ported from its own `Diagram.module.css`.
   *
   * Absent for a module whose diagram only uses the shared text classes. Per module rather than
   * global because the web scopes these with CSS modules and the same name means different
   * things in different ones.
   */
  diagramClasses?: DiagramClasses;
  presetActiveKey: (id: string) => string;
  /**
   * The one-off buttons in the scenario bar, and the two ways one can act.
   *
   * `perturb` writes engine STATE, for something momentary — a stimulus, a manoeuvre, a bolus,
   * whose decay is the physiology and which has no standing quantity to hold. `nudge` writes the
   * INPUTS, clamped to the slider's own range, for a standing change to the patient: a litre of
   * blood lost stays lost, and the rail has to show it. Every one of these buttons used to take
   * only `perturb`, so a haemorrhage moved the model while the blood-volume slider went on reading
   * its starting value — the screen told the learner two different things about one patient.
   *
   * `variant` carries 'danger' as well as 'impulse' because the web's bar does, and a bar where an
   * insult and a treatment look alike is a bar that has stopped saying which is which.
   */
  actions: (
    inputs: TInputs,
    perturb: (fn: (state: TState) => TState) => void,
    nudge: (deltas: Partial<Record<string & keyof TInputs, number>>) => void,
  ) => { label: string; onPress: () => void; variant: 'impulse' | 'danger' }[];
}

/** An adapter whose type parameters have been erased, as the screen sees it after loading. */
export type AnyModuleAdapter = ModuleAdapter<unknown, unknown, unknown, unknown>;
