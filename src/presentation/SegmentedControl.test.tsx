import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

afterEach(cleanup);

/**
 * The harness spike: the first component rendered through the react-native-web alias. If this
 * file is green, the alias approach works and the suite below it is real.
 */
describe('SegmentedControl', () => {
  const SEGMENTS = [
    { value: 'lab' as const, label: 'Lab' },
    { value: 'questions' as const, label: 'Questions' },
  ];

  it('renders every segment and marks the selected one', () => {
    render(<SegmentedControl segments={SEGMENTS} value="lab" onChange={() => {}} />);
    const lab = screen.getByRole('tab', { name: 'Lab' });
    const questions = screen.getByRole('tab', { name: 'Questions' });
    expect(lab).toBeTruthy();
    expect(questions).toBeTruthy();
    // The selected segment carries the solid fill; the other is transparent.
    expect((lab as HTMLElement).style.backgroundColor).not.toBe('');
    expect((questions as HTMLElement).style.backgroundColor).toBe('');
  });

  it('notifies on change, and not when the segment is already selected', () => {
    const onChange = vi.fn();
    render(<SegmentedControl segments={SEGMENTS} value="lab" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Questions' }));
    expect(onChange).toHaveBeenCalledWith('questions');
    fireEvent.click(screen.getByRole('tab', { name: 'Lab' }));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('steps four-up labels down to micro so Patients and Questions fit at 375pt', () => {
    const FOUR = [
      { value: 'lab' as const, label: 'Lab' },
      { value: 'clinic' as const, label: 'Patients' },
      { value: 'questions' as const, label: 'Questions' },
      { value: 'lessons' as const, label: 'Lessons' },
    ];
    // jsdom never lays out, and the atomic classes never resolve through getComputedStyle
    // here — so read the declared rule out of the injected stylesheet instead. 11px is
    // FONT.micro; the three-up strip keeps 13px FONT.xs.
    const declaredFontSize = (name: string): string | null => {
      const el = screen.getByRole('tab', { name }).firstChild as Element;
      const cls = [...el.classList].find((c) => c.startsWith('r-fontSize-'));
      if (!cls) return null;
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of Array.from(rules)) {
          if (rule.cssText.includes(`.${cls}`)) {
            return rule.cssText.match(/font-size:\s*([^;!]+)/)?.[1]?.trim() ?? null;
          }
        }
      }
      return null;
    };
    const { unmount } = render(<SegmentedControl segments={FOUR} value="lab" onChange={() => {}} />);
    expect(declaredFontSize('Questions')).toBe('11px');
    unmount();
    cleanup();
    render(<SegmentedControl segments={SEGMENTS} value="lab" onChange={() => {}} />);
    expect(declaredFontSize('Questions')).toBe('13px');
  });
});
