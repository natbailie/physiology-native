import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RoundBoard } from './RoundBoard';
import type { Round, RoundBed } from '../home/useRound';

// `CardShell` draws its corner wash with `react-native-svg`, which is native code the
// test runner cannot parse (it is not behind the `react-native` → `react-native-web`
// alias). The beds under test carry no accent, so the wash never renders — the mock only
// has to exist for the import to resolve.
vi.mock('react-native-svg', () => ({
  __esModule: true,
  default: () => null,
  Defs: () => null,
  Rect: () => null,
  RadialGradient: () => null,
  Stop: () => null,
}));

afterEach(cleanup);

function bed(id: string, acuity: RoundBed['acuity'] = 'newAdmission'): RoundBed {
  return {
    id,
    moduleId: 'shockStates',
    name: id,
    age: 40,
    oneLiner: 'A presenting complaint.',
    questionIds: ['q'],
    acuity,
    dueCount: 0,
    moduleName: 'Shock States',
    unlocked: true,
  };
}

function round(
  today: RoundBed[],
  rest: RoundBed[],
  referrals: RoundBed[] = [],
  everySpecialty: Round['everySpecialty'] = [],
): Round {
  return {
    beds: [...today, ...rest],
    today,
    rest,
    referrals,
    everySpecialty,
    ready: true,
  };
}

function show(r: Round) {
  return render(<RoundBoard round={r} onOpenBed={() => {}} onOpenPricing={() => {}} />);
}

describe('RoundBoard', () => {
  it('renders nothing before the round is ready', () => {
    // Beds present but the indices still landing: only the `ready` gate can suppress this,
    // so removing it (and not the empty-ward gate) is what this catches.
    const beds = [bed('Ann', 'due')];
    const { container } = show({ beds, today: beds, rest: [], referrals: [], everySpecialty: [], ready: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing with no beds and no referrals', () => {
    const { container } = show({ beds: [], today: [], rest: [], referrals: [], everySpecialty: [], ready: true });
    expect(container.firstChild).toBeNull();
  });

  it('shows today’s slice with the rest one press away', () => {
    show(round([bed('Ann', 'due'), bed('Bob')], [bed('Cat')]));
    expect(screen.getByRole('button', { name: /Ann/ })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Cat/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Show all 3/ }));
    expect(screen.getByRole('button', { name: /Cat/ })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Back to today/ }));
    expect(screen.queryByRole('button', { name: /Cat/ })).toBeNull();
  });

  it('offers no expander when the ward fits', () => {
    show(round([bed('Ann')], []));
    expect(screen.queryByRole('button', { name: /Show all/ })).toBeNull();
  });

  it('labels each bed with its acuity word', () => {
    show(
      round(
        [bed('Ann', 'crash'), bed('Bob', 'due'), bed('Cat', 'check'), bed('Dan', 'newAdmission')],
        [],
      ),
    );
    expect(screen.getByText('CRASH')).toBeDefined();
    expect(screen.getByText('DUE')).toBeDefined();
    expect(screen.getByText('CHECK')).toBeDefined();
    expect(screen.getByText('NEW')).toBeDefined();
  });

  /**
   * Presence on screen is not enough. `CardShell` puts the label on its `Pressable`, and an
   * explicit `accessibilityLabel` REPLACES the children as the accessible name — so a bed can
   * render CRASH in red and still announce nothing but a name, leaving colour as the only
   * carrier. The `name: /Ann/` queries above pass either way, which is how that got through.
   */
  it('announces the acuity and the module, not just the name', () => {
    show(round([bed('Ann', 'crash')], []));
    expect(screen.getByRole('button', { name: /CRASH/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Shock States/ })).toBeDefined();
  });

  it('routes a bed press to its bedside and a referral press to pricing', () => {
    const onOpenBed = vi.fn();
    const onOpenPricing = vi.fn();
    const beds = [bed('Ann', 'due')];
    const referrals = [{ ...bed('Zed'), unlocked: false }];
    render(<RoundBoard round={round(beds, [], referrals)} onOpenBed={onOpenBed} onOpenPricing={onOpenPricing} />);

    fireEvent.click(screen.getByRole('button', { name: /Ann/ }));
    expect(onOpenBed).toHaveBeenCalledWith(expect.objectContaining({ id: 'Ann' }));

    fireEvent.click(screen.getByRole('link', { name: /See who/ }));
    expect(onOpenPricing).toHaveBeenCalledTimes(1);
  });

  it('names the referrals it is hiding', () => {
    show(round([bed('Ann')], [], [{ ...bed('Zed'), unlocked: false }]));
    // The count is its own <Text> so it can carry the figure weight, so match the tail
    // rather than the whole sentence.
    expect(screen.getByText(/more patient is on/)).toBeDefined();
    expect(screen.getByText(/Zed/)).toBeDefined();
  });

  it('opens the round on the top of the board, not on the alphabetical first bed', () => {
    // `todaysRound` puts crash and due first and shuffles the rest per day, so the board's
    // own order is the honest starting point — `beds[0]` would hand back the same name daily.
    const onOpenBed = vi.fn();
    const r = round([bed('Zoe', 'crash')], [bed('Ann')]);
    render(<RoundBoard round={r} onOpenBed={onOpenBed} onOpenPricing={() => {}} />);

    fireEvent.click(screen.getByRole('link', { name: /Start round/ }));
    expect(onOpenBed).toHaveBeenCalledWith(expect.objectContaining({ id: 'Zoe' }));
  });

  it('counts the whole ward in the action, not today’s slice', () => {
    show(round([bed('Ann'), bed('Bob')], [bed('Cat')]));
    expect(screen.getByRole('link', { name: /Start round\. 3 patients\./ })).toBeDefined();
  });

  it('says patient, singular, for a ward of one', () => {
    show(round([bed('Ann')], []));
    expect(screen.getByRole('link', { name: /Start round\. 1 patient\./ })).toBeDefined();
  });

  it('offers no action when every patient is a referral', () => {
    // A locked module holds no review state, so there is no bed to start on.
    show(round([], [], [{ ...bed('Zed'), unlocked: false }]));
    expect(screen.queryByRole('link', { name: /Start round/ })).toBeNull();
  });
});
