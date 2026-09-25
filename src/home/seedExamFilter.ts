import { setExamFilter } from './examFilter';
import type { ExamId } from './exams';

/**
 * Seed the catalogue filter from the learner's SAVED exam, once per launch.
 *
 * This is the one place the phone deliberately departs from the web. `examFilter.ts` says every
 * visit starts on "All exams" and the saved exam is not applied on arrival — right for a browser
 * tab, wrong for an app a learner opens twenty times a week to revise one syllabus.
 *
 * Two rules, and the second is the reason this is not just a call to `setExamFilter`:
 *
 *   - It runs ONCE. A later profile load, a re-render or a tab return must not re-apply it.
 *   - It never overrules the learner. The call site runs it in an effect gated on the profile
 *     being ready, and it is spent on the first call, so a learner who has already touched the
 *     filter keeps their choice.
 *
 * KNOWN LIMIT: a learner who changes the filter in the window before the profile resolves is
 * still overruled. Closing that needs a "has the learner chosen?" flag set by `setExamFilter`,
 * which lives in the synced file and cannot take one.
 *
 * It lives in its own file because `examFilter.ts` is FILE-SYNCED from the web repo
 * (`scripts/sync-engines.mjs`). An export added there is deleted by the next `npm run sync`,
 * which is exactly what happened to the previous version of this function.
 */
let spent = false;

export function seedExamFilter(next: ExamId | null): void {
  if (spent) return;
  spent = true;
  if (next) setExamFilter(next);
}

/** Reset between tests, where a module-level flag would otherwise leak across cases. */
export function clearExamSeedForTests(): void {
  spent = false;
}
