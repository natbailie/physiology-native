import { caseModules } from './manifest.generated';
import type { ModuleCase } from '../shared/cases/types';

function isBed(value: unknown): value is ModuleCase<string, any> {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.preset === 'string' &&
    Array.isArray(entry.chart)
  );
}

function bedsIn(exports: Record<string, unknown>): readonly ModuleCase<string, any>[] {
  // Found by shape rather than by name, exactly as home/moduleCases.ts does it: each module
  // calls its array something different (SHOCK_CASES, RESP_CASES, ...). That index projects to
  // RoundCase for the board; this one keeps the full bed — chart accessors, history, payoff —
  // which is what a module screen renders.
  const found = Object.values(exports).find(
    (value): value is readonly ModuleCase<string, any>[] =>
      Array.isArray(value) && value.length > 0 && value.every(isBed),
  );
  return found ?? [];
}

/**
 * One module's beds, loaded on demand. Empty for the 49 modules without any — tab
 * availability comes from the manifest key, never from awaiting this.
 */
export async function loadModuleCases(moduleId: string): Promise<readonly ModuleCase<string, any>[]> {
  const loader = caseModules[moduleId];
  if (!loader) return [];
  return bedsIn((await loader()) as Record<string, unknown>);
}
