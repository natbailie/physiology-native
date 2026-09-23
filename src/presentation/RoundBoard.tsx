/**
 * The ward round: the first thing a returning learner sees. A port of the web's
 * `src/home/RoundBoard.tsx`.
 *
 * Hand-written here rather than file-synced: the web component is JSX plus a CSS module, and
 * only its behaviour and prose are portable. `summarise()` is copied verbatim so the two apps
 * never word the ward differently — reworded upstream, it has to be rewritten here.
 *
 * It lives in `src/presentation/` and NOT beside its synced counterpart in `src/home/`, which
 * is a sync-policed directory: `scripts/sync-engines.mjs` lists `src/home` in
 * SYNCED_ONLY_DIRS and `npm run sync:check` would report any file there with no web source as
 * an orphan. Same arrangement as `StudyStrip` and `StudyReport`.
 *
 * Renders NOTHING until both indices and entitlement have landed, which is the rule
 * `StudyStrip` and `StudyReport` already state in their own docblocks — a board of
 * placeholder beds that rewrites itself a moment later is worse than a board that arrives
 * once. Unlike those two it does NOT wait for the learner to have attempted something: a ward
 * with people in it nobody has met is a legitimate first screen; three zeroes are not.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Acuity } from '../shared/cases/acuity';
import { THEMES, type ThemeId } from '../home/moduleRegistry';
import { setSpecialtyFilter, useSpecialtyFilter } from '../home/specialtyFilter';
import type { Round, RoundBed } from '../home/useRound';
import { Badge } from './cards/Badge';
import { CardShell } from './cards/CardShell';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from './theme';

/** The word on the chip. Colour is the second carrier here, never the only one. */
const ACUITY_LABEL: Record<Acuity, string> = {
  crash: 'CRASH',
  due: 'DUE',
  check: 'CHECK',
  newAdmission: 'NEW',
};

function Bed({
  bed,
  onOpen,
}: {
  bed: RoundBed;
  /** Routes to the patient's bedside. Injected so tests never need a router. */
  onOpen: (bed: RoundBed) => void;
}) {
  const { color } = useAppTheme();
  const tone =
    bed.acuity === 'crash'
      ? color.danger
      : bed.acuity === 'due'
        ? color.warn
        : bed.acuity === 'check'
          ? color.ok
          : color.textFaint;
  return (
    /* The acuity word and the module are IN the label, not only on screen. `CardShell` puts
       this on its `Pressable`, and an explicit label REPLACES the children as the accessible
       name — so leaving them out left colour as the only carrier of acuity for a screen-reader
       user, which is exactly what the comment above forbids. The web has no such problem: there
       the chip is a child of the anchor. `ClinicPanel` labels its own bed chips the same way. */
    <CardShell
      onPress={() => onOpen(bed)}
      accessibilityLabel={`${ACUITY_LABEL[bed.acuity]}. ${bed.name}, ${bed.age}. ${bed.oneLiner} ${bed.moduleName}.`}
    >
      <View style={styles.bedRow}>
        <Badge label={ACUITY_LABEL[bed.acuity]} tone={tone} />
        <View style={styles.who}>
          <Text style={[styles.name, { color: color.text }]}>
            {bed.name}, {bed.age}
          </Text>
          <Text style={[styles.oneLiner, { color: color.textDim }]} numberOfLines={2}>
            {bed.oneLiner}
          </Text>
          <Text style={[styles.module, { color: color.textFaint }]} numberOfLines={1}>
            {bed.moduleName}
          </Text>
        </View>
      </View>
    </CardShell>
  );
}

/**
 * The specialties on the ward, in catalogue order.
 *
 * Offered from the UNFILTERED ward (`round.everySpecialty`) rather than from the beds on screen,
 * or selecting one would leave a row containing only itself and no way back — the same trap
 * "All" exists to avoid on the catalogue bar. Mirrors the web's `SpecialtyChips`.
 */
function SpecialtyChips({ available }: { available: readonly ThemeId[] }) {
  const { color } = useAppTheme();
  const active = useSpecialtyFilter();
  if (available.length < 2) return null;

  const ordered = THEMES.filter((theme) => available.includes(theme.id));

  const chip = (id: ThemeId | null, label: string) => {
    const selected = active === id;
    return (
      <Pressable
        key={id ?? 'all'}
        onPress={() => setSpecialtyFilter(id)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.chip,
          {
            borderColor: selected ? color.brand : color.panelBorder,
            backgroundColor: selected ? color.brand : color.panel,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.chipText, { color: selected ? color.onSolid : color.textDim }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.filter}>
      {chip(null, 'All')}
      {ordered.map((theme) => chip(theme.id, theme.name))}
    </View>
  );
}

/** How the ward reads in one line: the urgent count if there is one, otherwise the honest state. */
function summarise(beds: readonly RoundBed[]): string {
  const crash = beds.filter((b) => b.acuity === 'crash').length;
  const due = beds.filter((b) => b.acuity === 'due').length;
  if (crash > 0) return `${crash} needing attention, ${due} routine`;
  if (due > 0) return `${due} to review`;
  const unmet = beds.filter((b) => b.acuity === 'newAdmission').length;
  if (unmet > 0) return `${unmet} you have not met yet`;
  return 'Everyone seen. Nothing outstanding.';
}

export function RoundBoard({
  round,
  onOpenBed,
  onOpenPricing,
}: {
  round: Round;
  /** Routes to `/module/${bed.moduleId}?case=${bed.id}`. Injected so tests never need a router. */
  onOpenBed: (bed: RoundBed) => void;
  /** Routes to `/pricing` — the native stand-in for the web's `#pricing` anchor. */
  onOpenPricing: () => void;
}) {
  const { color } = useAppTheme();
  const [showAll, setShowAll] = useState(false);
  if (!round.ready) return null;
  if (round.beds.length === 0 && round.referrals.length === 0) return null;

  // Today's slice, with the rest one press away. The summary counts the whole ward — crash
  // and due beds are always in the slice, so it never disagrees with what is shown.
  const shown = showAll ? round.beds : round.today;

  // Where "Start round" goes: the top of the board as drawn, not the globally highest-ranked
  // bed. When something is urgent those are the same thing — `todaysRound` puts crash and due
  // first. When nothing is, `today` is the day's deterministic shuffle, so the round opens on
  // the patient the learner is actually looking at and rotates tomorrow, where `beds[0]` would
  // hand them the same alphabetical name every morning until they answered something.
  const first = round.today[0];

  // The web wraps this in `<section aria-label="Ward round">`. React Native has no landmark, and
  // the two ways of faking one are both worse than nothing: an `accessibilityLabel` on a bare
  // View is never exposed at all, and adding `accessible` to expose it collapses the whole
  // subtree into ONE element — every bed would stop being reachable. So the heading carries the
  // role instead, which is what a screen reader actually navigates this board by.
  return (
    <View style={styles.board}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: color.text }]} accessibilityRole="header">
          Your round
        </Text>
        {round.beds.length > 0 && (
          <Text style={[styles.summary, { color: color.textDim }]}>{summarise(round.beds)}</Text>
        )}
      </View>

      <SpecialtyChips available={round.everySpecialty} />

      {round.beds.length === 0 && round.referrals.length > 0 && (
        <Text style={[styles.empty, { color: color.textDim }]}>
          No patients on this ward you have access to.
        </Text>
      )}

      {first && (
        /* The one primary action on this screen. The label carries the count so a screen-reader
           user hears the size of the ward without walking the beds. */
        <Pressable
          onPress={() => onOpenBed(first)}
          accessibilityRole="link"
          accessibilityLabel={`Start round. ${round.beds.length} ${round.beds.length === 1 ? 'patient' : 'patients'}.`}
          style={({ pressed }) => [
            styles.start,
            { backgroundColor: color.brand },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.startText, { color: color.onSolid }]} numberOfLines={1}>
            Start round · {round.beds.length} {round.beds.length === 1 ? 'patient' : 'patients'}
          </Text>
        </Pressable>
      )}

      {shown.length > 0 && (
        <View style={styles.beds}>
          {shown.map((bed) => (
            <Bed key={bed.id} bed={bed} onOpen={onOpenBed} />
          ))}
        </View>
      )}

      {!showAll && round.rest.length > 0 && (
        <Pressable
          onPress={() => setShowAll(true)}
          accessibilityRole="button"
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={[styles.more, { color: color.brand }]}>
            Show all {round.beds.length} ({round.rest.length} more on the wards today)
          </Text>
        </Pressable>
      )}
      {showAll && round.rest.length > 0 && (
        <Pressable
          onPress={() => setShowAll(false)}
          accessibilityRole="button"
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={[styles.more, { color: color.brand }]}>Back to today&apos;s round</Text>
        </Pressable>
      )}

      {round.referrals.length > 0 && (
        <View style={[styles.referrals, { borderColor: color.panelBorder }]}>
          <Text style={[styles.referralText, { color: color.text }]}>
            <Text style={styles.referralCount}>{round.referrals.length}</Text> more{' '}
            {round.referrals.length === 1 ? 'patient is' : 'patients are'} on wards you do not have
            access to
            {round.referrals.length <= 3 && ` — ${round.referrals.map((r) => r.name).join(', ')}`}.
          </Text>
          <Pressable
            onPress={onOpenPricing}
            accessibilityRole="link"
            accessibilityLabel="See who has full access"
            style={({ pressed }) => [
              styles.referralAction,
              { borderColor: color.panelBorder, backgroundColor: color.panel },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.referralLink, { color: color.textDim }]}>See who →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: SPACE.lg },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACE.md, flexWrap: 'wrap' },
  title: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  summary: { fontSize: FONT.sm },
  beds: { gap: SPACE.md },
  bedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  who: { flex: 1, gap: 1, minWidth: 0 },
  name: { fontSize: FONT.sm, fontWeight: '700' },
  oneLiner: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.snug },
  module: { fontSize: FONT.micro, fontWeight: '600', letterSpacing: 0.6 },
  pressed: { opacity: 0.6 },
  // The specialty switcher, matching the web's chip row.
  filter: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, alignItems: 'center' },
  chip: { borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, minHeight: TAP },
  chipText: { fontSize: FONT.micro, fontWeight: '600' },
  // A filtered ward with nothing on it is a real answer, not a rendering failure.
  empty: { fontSize: FONT.sm },
  // The one primary action: the way into the board the beds could not be, since eight
  // equally-weighted cards are eight primary actions, which is none.
  start: {
    minHeight: TAP,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { fontSize: FONT.sm, fontWeight: '700' },
  // The rest of today's ward, one press away. A quiet button, not a card: the beds are the
  // content and this is chrome.
  more: { fontSize: FONT.sm, fontWeight: '700', alignSelf: 'flex-start' },
  // Referrals: locked modules. Deliberately NOT an acuity chip — see useRound.
  //
  // The border stays DASHED on purpose. This is the revenue surface and it was too quiet, but
  // the fix is status, not disguise: a solid border would read as a bed, and the whole point of
  // the referrals split is that a locked module can hold no review state and must not claim one.
  referrals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    flexWrap: 'wrap',
    padding: SPACE.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
  },
  referralText: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.snug, flexShrink: 1, flex: 1 },
  referralCount: { fontWeight: '700' },
  referralAction: {
    minHeight: TAP,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralLink: { fontSize: FONT.sm, fontWeight: '700' },
});
