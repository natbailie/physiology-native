import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ReadoutTile } from './ReadoutTile';

afterEach(cleanup);

/** The extraction contract: the grid's tile and the bedside chart render one thing. */
describe('ReadoutTile', () => {
  it('prints the value with its unit', () => {
    render(<ReadoutTile label="MAP" value="62" unit="mmHg" />);
    expect(screen.getByText('MAP')).toBeTruthy();
    expect(screen.getByText('62')).toBeTruthy();
    expect(screen.getByText('mmHg')).toBeTruthy();
  });

  it('withholds a pattern-naming tile while its question is unanswered', () => {
    render(<ReadoutTile label="Pattern" value="hypovolaemic" withheld />);
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('hypovolaemic')).toBeNull();
    expect(screen.getByText('you are naming this one')).toBeTruthy();
  });
});
