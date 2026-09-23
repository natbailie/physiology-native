/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

/**
 * Binds all 51 hand-written `nativeLoopConfig.ts` files to the 51 synced `constants.ts` beside
 * them, across the one boundary `sync-engines.mjs --check` structurally cannot cross.
 *
 * `loopConfig.ts` is in the sync script's `SKIP_ENGINE_FILES`, because the web's version imports a
 * web-only type — so the loop config is the only part of a module's contract maintained twice, and
 * the only class of drift in this repo with no guard on it. It drifted: `anaesthesia` declares
 * `SETTLE_SECONDS: 900` in its synced constants and the web loop config names it, and the native
 * one did not. The phone opened that module on a raw `createInitialState()` — alveolar agent zero,
 * effect-site zero — and the learner watched nine hundred seconds of wash-in climb into place
 * while the web opened on the settled steady state. `shared/engine/settle.ts` promises "one
 * implementation, file-synced, so the phone and the web open identically"; this is what checks it.
 *
 * Asked as an IFF rather than a presence check. A module that deliberately opens on a trajectory —
 * a cell cycle progressing, a bladder filling, an insult resolving — exports no `SETTLE_SECONDS`
 * and must declare no `settleSeconds`, and settling one of those would jump past the thing the
 * module is about.
 */
const configs = import.meta.glob<Record<string, unknown>>('./*/nativeLoopConfig.ts', { eager: true });
const constants = import.meta.glob<Record<string, unknown>>('./*/constants.ts', { eager: true });

const moduleIdOf = (path: string): string => path.match(/\.\/([^/]+)\//)![1]!;

/** The `*_SIMULATION` block, found by shape: every module names it differently (`SIMULATION`,
 * `ANAESTHESIA_SIMULATION`, `SHOCK_SIMULATION`). Same rule the web's harnesses use, and for the
 * same reason — a hand-maintained list of export names would be the one that silently under-reports. */
function settleSecondsConstant(exports: Record<string, unknown>): number | undefined {
  for (const value of Object.values(exports)) {
    if (value && typeof value === 'object' && 'SETTLE_SECONDS' in value) {
      const seconds = (value as { SETTLE_SECONDS: unknown }).SETTLE_SECONDS;
      if (typeof seconds === 'number') return seconds;
    }
  }
  return undefined;
}

function loopConfigOf(exports: Record<string, unknown>): Record<string, unknown> | undefined {
  for (const value of Object.values(exports)) {
    if (value && typeof value === 'object' && 'step' in value && 'computeDerived' in value) {
      return value as Record<string, unknown>;
    }
  }
  return undefined;
}

const modules = Object.entries(configs)
  .map(([path, exports]) => {
    const id = moduleIdOf(path);
    return {
      id,
      config: loopConfigOf(exports),
      declared: settleSecondsConstant((constants[`./${id}/constants.ts`] ?? {}) as Record<string, unknown>),
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

describe('the phone and the web open identically', () => {
  it('discovered every module', () => {
    expect(modules.length).toBeGreaterThanOrEqual(45);
    expect(modules.filter((m) => !m.config).map((m) => m.id)).toEqual([]);
  });

  it.each(modules.map((m) => [m.id, m] as const))('%s', (id, module) => {
    expect(
      module.config!.settleSeconds,
      module.declared === undefined
        ? `${id}: declares a settleSeconds its constants do not define — the web opens this module on a trajectory`
        : `${id}: its constants define SETTLE_SECONDS=${module.declared} and this config does not name it, so the phone opens on an unsettled transient the web never shows`,
    ).toBe(module.declared);
  });
});
