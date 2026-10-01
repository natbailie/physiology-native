import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

afterEach(cleanup);

describe('ProgressBar', () => {
  it('exposes its value to assistive tech', () => {
    render(<ProgressBar value={3} max={10} label="Questions known" />);
    const bar = screen.getByRole('progressbar', { name: 'Questions known' });
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuemax')).toBe('10');
  });

  it('clamps an over-full value and survives a zero maximum', () => {
    render(<ProgressBar value={99} max={0} label="Empty" showCount />);
    expect(screen.getByRole('progressbar', { name: 'Empty' }).getAttribute('aria-valuenow')).toBe('0');
  });

  it('prints the count when asked, so the fill is never the only signal', () => {
    render(<ProgressBar value={4} max={8} label="Known" showCount />);
    expect(screen.getByText('4/8')).toBeTruthy();
  });
});
