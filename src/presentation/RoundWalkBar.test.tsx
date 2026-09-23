import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RoundWalkBar } from './RoundWalkBar';
import type { RoundBed } from '../home/useRound';
import type { RoundWalk } from './useRoundWalk';

afterEach(cleanup);

function neighbour(id: string, moduleId = 'cardiorenal'): RoundBed {
  return {
    id,
    moduleId,
    name: id,
    age: 61,
    oneLiner: 'Next on the round.',
    questionIds: ['q'],
    acuity: 'newAdmission',
    dueCount: 0,
    moduleName: 'Cardiorenal',
    unlocked: true,
  };
}

const WALK: RoundWalk = { previous: neighbour('Zoe'), next: neighbour('Bob'), position: 2, total: 5 };

function show(walk: RoundWalk, onWalk: (bed: RoundBed) => void = () => {}) {
  return render(<RoundWalkBar walk={walk} accent="#000" onWalk={onWalk} />);
}

describe('RoundWalkBar', () => {
  it('names the patients either side, not "previous" and "next"', () => {
    // The name is what tells a learner whether the step is worth taking, and it is the same
    // currency the round board used.
    show(WALK);
    expect(screen.getByRole('link', { name: /Previous patient: Zoe/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Next patient: Bob/ })).toBeTruthy();
    expect(screen.getByText('2 of 5')).toBeTruthy();
  });

  it('routes a step to the neighbouring bed, across modules', () => {
    const onWalk = vi.fn();
    show(WALK, onWalk);
    fireEvent.click(screen.getByRole('link', { name: /Next patient: Bob/ }));
    expect(onWalk).toHaveBeenCalledWith(expect.objectContaining({ id: 'Bob', moduleId: 'cardiorenal' }));
  });

  it('says where the round ends rather than dropping the control', () => {
    // A control that vanishes at the edge leaves the learner wondering whether they mis-pressed.
    show({ previous: null, next: neighbour('Bob'), position: 1, total: 2 });
    expect(screen.getByText('First on the round')).toBeTruthy();
  });

  it('renders nothing for a patient who is not on the round', () => {
    const { container } = show({ previous: null, next: null, position: null, total: 0 });
    expect(container.firstChild).toBeNull();
  });
});
