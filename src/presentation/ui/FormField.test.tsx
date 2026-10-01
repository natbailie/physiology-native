import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FormField } from './FormField';

afterEach(cleanup);

describe('FormField', () => {
  it('labels its input', () => {
    render(<FormField label="Email" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('writes the problem out next to the field, in words', () => {
    render(<FormField label="Email" value="x" onChangeText={() => {}} error="That doesn't look like an email address." />);
    expect(screen.getByText("That doesn't look like an email address.")).toBeTruthy();
  });

  it('shows nothing extra when there is no problem', () => {
    render(<FormField label="Email" value="a@b.co" onChangeText={() => {}} error={null} />);
    expect(screen.queryByText('!')).toBeNull();
  });
});
