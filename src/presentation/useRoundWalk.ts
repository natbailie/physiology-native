import { useMemo } from 'react';
import { MODULES } from '../home/moduleRegistry';
import { useRound, type Round, type RoundBed } from '../home/useRound';
import type { Entitlement } from '../billing/useEntitlement';

const MODULE_NAMES = new Map(MODULES.map((module) => [module.id, module.name]));
const moduleNameOf = (moduleId: string): string => MODULE_NAMES.get(moduleId) ?? moduleId;

export interface RoundWalk {
  previous: RoundBed | null;
  next: RoundBed | null;
  /** Where this patient sits in the walk, 1-based, for "3 of 8". Null when off the round. */
  position: number | null;
  total: number;
}

const NOWHERE: RoundWalk = { previous: null, next: null, position: null, total: 0 };

/** Pure, so the ordering rule is testable without a router or a store. */
export function walkFrom(round: Round, caseId: string | null): RoundWalk {
  if (caseId === null || !round.ready) return NOWHERE;
  const list = round.today.some((bed) => bed.id === caseId) ? round.today : round.beds;
  const index = list.findIndex((bed) => bed.id === caseId);
  if (index === -1) return NOWHERE;
  return {
    previous: index > 0 ? list[index - 1]! : null,
    next: index < list.length - 1 ? list[index + 1]! : null,
    position: index + 1,
    total: list.length,
  };
}

/**
 * Previous and next patient, so a round can be walked instead of returned to. The phone's half
 * of the web's `src/shared/hooks/useRoundWalk.ts`.
 *
 * Hand-written rather than synced for one reason: entitlement. The web calls `useEntitlement`
 * inside the hook; native signs in through `useNativeEntitlement`, a different implementation of
 * the same interface, so it is passed in here — the same reason `useRound` itself takes it.
 *
 * The ordering rule lives in `walkFrom` and is identical on both platforms: today's board first,
 * the whole ward only for a patient reached through "Show all" or a shared link. That makes the
 * walk match what the learner saw and inherit the specialty filter for free.
 */
export function useRoundWalk(caseId: string | null, entitlement: Entitlement): RoundWalk {
  const round = useRound(moduleNameOf, entitlement);
  return useMemo(() => walkFrom(round, caseId), [caseId, round]);
}
