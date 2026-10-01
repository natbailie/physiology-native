import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RetryButton } from './RetryButton';

describe('RetryButton', () => {
  it('calls back when pressed', () => {
    const onPress = vi.fn();
    render(<RetryButton onPress={onPress} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
