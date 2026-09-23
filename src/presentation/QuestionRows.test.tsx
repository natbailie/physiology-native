import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PatternRow, PredictRow, type CommittedAnswer } from './QuestionRows';

afterEach(cleanup);

const LABELS = { normal: 'Normal', pulmonaryEmbolism: 'Pulmonary embolism' };
// Sparse on purpose: the map is partial in every module, and an option with no entry must still
// render its label rather than a blank second line.
const GLOSS = { pulmonaryEmbolism: 'a clot arriving where the blood should leave' };

const PATTERN = {
  id: 'pe-vs-normal',
  stem: 'A sudden collapse with numbers that point one way.',
  answer: 'pulmonaryEmbolism',
  options: ['normal', 'pulmonaryEmbolism'],
  panel: [{ label: 'Marker', value: (s: { derived: { v: number } }) => s.derived.v }],
  explanation: 'The characteristic combination is what identifies it, at sufficient length here.',
};

const PANEL = [{ label: 'Marker', value: 8 }];

const PREDICT = {
  id: 'dial-up',
  stem: 'Something instructive is going on.',
  setup: {},
  intervention: { label: 'Turn the dial.', inputs: { dial: 3 } },
  prompt: 'What happens to the marker?',
  watch: 'the marker',
  correctDirection: 'rises',
  explanation: 'It rises because of the mechanism, at sufficient length here.',
  metric: (s: { derived: { v: number } }) => s.derived.v,
};

const OUTCOME = { before: 0, after: 6, observed: 'rises' as const, matches: true, decimals: 2 };

function showPattern({
  committed = null,
  onCommit = () => {},
  presetGloss,
}: {
  committed?: CommittedAnswer | null;
  onCommit?: (id: string, picked: string, correct: boolean) => void;
  presetGloss?: Record<string, string>;
} = {}) {
  return render(
    <PatternRow
      question={PATTERN as never}
      panel={PANEL}
      accent="#000"
      presetLabels={LABELS}
      presetGloss={presetGloss}
      committed={committed}
      onCommit={onCommit}
    />,
  );
}

function showPredict({
  committed = null,
  onCommit = () => {},
}: {
  committed?: CommittedAnswer | null;
  onCommit?: (id: string, picked: string, correct: boolean) => void;
} = {}) {
  return render(
    <PredictRow
      question={PREDICT as never}
      outcome={OUTCOME}
      accent="#000"
      committed={committed}
      onCommit={onCommit}
    />,
  );
}

describe('PatternRow', () => {
  it('shows labels and the panel before committing, verdict only after', () => {
    showPattern();
    expect(screen.getByRole('button', { name: 'Pulmonary embolism' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'pulmonaryEmbolism' })).toBeNull();
    expect(screen.getByText('8.00')).toBeTruthy();
    expect(screen.queryByText(/Correct/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Pulmonary embolism' }));
    expect(screen.getByText('Correct')).toBeTruthy();
  });

  /**
   * Order, not just presence. The panel is the evidence the options are answered from, and on a
   * phone a row of tappable options above it invites a commit before the learner has scrolled to
   * the numbers. Asserting only that both render would pass with them the wrong way round.
   */
  it('puts the panel above the options', () => {
    const { container } = showPattern();
    const text = container.textContent ?? '';
    expect(text).toContain('Marker');
    expect(text.indexOf('Marker')).toBeLessThan(text.indexOf('Pulmonary embolism'));
  });

  /**
   * The gloss is what makes an option answerable from the panel rather than from vocabulary, so
   * it has to reach the screen AND the accessible name — a second unlabelled text node would be
   * read out separately from the button it belongs to. The unglossed option is the other half:
   * the map is partial in every module.
   */
  it('prints a gloss under the option it belongs to, and nothing under one with none', () => {
    showPattern({ presetGloss: GLOSS });
    expect(screen.getByText('a clot arriving where the blood should leave')).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'Pulmonary embolism — a clot arriving where the blood should leave',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Normal' })).toBeTruthy();
  });

  it('reports once across retry and restores the verdict from the entry', () => {
    const onCommit = vi.fn();
    const { unmount } = showPattern({ onCommit });
    fireEvent.click(screen.getByRole('button', { name: 'Normal' }));
    expect(screen.getByText('Not quite')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Review labs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Normal' }));
    // The row reports every commit; the panel's gate keeps the ladder to the first.
    expect(onCommit).toHaveBeenCalledTimes(2);
    unmount();

    showPattern({ committed: { picked: 'normal', correct: false } });
    expect(screen.getByText('Not quite')).toBeTruthy();
    expect(screen.getByText(PATTERN.explanation)).toBeTruthy();
  });
});

describe('PredictRow', () => {
  it('shows the setup-settled value under its watch label before committing', () => {
    showPredict();
    expect(screen.getByText('the marker')).toBeTruthy();
    expect(screen.getByText('0.00')).toBeTruthy();
    expect(screen.queryByText(/Correct/)).toBeNull();
  });

  it('commits a direction and shows the settled outcome', () => {
    const onCommit = vi.fn();
    showPredict({ onCommit });
    fireEvent.click(screen.getByRole('button', { name: 'Rises' }));
    expect(onCommit).toHaveBeenCalledWith('dial-up', 'rises', true);
    expect(screen.getByText(/6\.00/)).toBeTruthy();
  });
});
