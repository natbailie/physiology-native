import { describe, expect, it } from 'vitest';
import { walkFrom } from './useRoundWalk';
import type { Round, RoundBed } from '../home/useRound';

function bed(id: string, moduleId = 'shockStates'): RoundBed {
  return {
    id,
    moduleId,
    name: id,
    age: 40,
    oneLiner: 'A presenting complaint.',
    questionIds: ['q'],
    acuity: 'newAdmission',
    dueCount: 0,
    moduleName: 'Shock States',
    unlocked: true,
  };
}

function round(today: RoundBed[], rest: RoundBed[] = []): Round {
  return {
    beds: [...today, ...rest],
    today,
    rest,
    referrals: [],
    everySpecialty: [],
    ready: true,
  };
}

describe('walkFrom', () => {
  it('names the patients either side, and where this one sits', () => {
    const w = walkFrom(round([bed('Ann'), bed('Bob'), bed('Cat')]), 'Bob');
    expect(w.previous?.id).toBe('Ann');
    expect(w.next?.id).toBe('Cat');
    expect(w.position).toBe(2);
    expect(w.total).toBe(3);
  });

  it('reports the ends of the round rather than wrapping round to the start', () => {
    const r = round([bed('Ann'), bed('Bob')]);
    expect(walkFrom(r, 'Ann').previous).toBeNull();
    expect(walkFrom(r, 'Bob').next).toBeNull();
  });

  it('walks TODAY’s board, which is what the learner was looking at', () => {
    // And which is what makes the walk inherit the specialty filter for free: `useRound`
    // applies that before the daily slice, so `today` is already narrowed.
    const w = walkFrom(round([bed('Ann'), bed('Bob')], [bed('Zed')]), 'Ann');
    expect(w.total).toBe(2);
    expect(w.next?.id).toBe('Bob');
  });

  it('falls back to the whole ward for a patient reached past today’s slice', () => {
    // "Show all", or a shared link. They are genuinely on the round, just not in today's ten.
    const w = walkFrom(round([bed('Ann')], [bed('Yan'), bed('Zed')]), 'Yan');
    expect(w.total).toBe(3);
    expect(w.previous?.id).toBe('Ann');
    expect(w.next?.id).toBe('Zed');
  });

  it('crosses modules, because a ward round is not one organ system', () => {
    const w = walkFrom(round([bed('Ann', 'respiratory'), bed('Bob', 'cardiorenal')]), 'Ann');
    expect(w.next?.moduleId).toBe('cardiorenal');
  });

  it('offers no walk for a patient who is not on the round at all', () => {
    expect(walkFrom(round([bed('Ann')]), 'Nobody').position).toBeNull();
  });

  it('offers no walk before the round is ready', () => {
    const notReady: Round = { beds: [], today: [], rest: [], referrals: [], everySpecialty: [], ready: false };
    expect(walkFrom(notReady, 'Ann').position).toBeNull();
  });
});
