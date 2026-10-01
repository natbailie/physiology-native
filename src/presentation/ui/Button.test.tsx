import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('calls back when pressed', () => {
    const onPress = vi.fn();
    render(<Button label="Continue" onPress={onPress} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while loading, and says it is busy', () => {
    const onPress = vi.fn();
    render(<Button label="Subscribe" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Subscribe' });
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('ignores presses when disabled', () => {
    const onPress = vi.fn();
    render(<Button label="Go" onPress={onPress} disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
