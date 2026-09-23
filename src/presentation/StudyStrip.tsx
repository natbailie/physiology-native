/**
 * What a returning learner sees under the round: two figures and a status, and no action.
 * A port of the web's `src/home/StudyStrip.tsx`.
 *
 * Deliberately absent until they have answered something: a dashboard of zeroes is a worse first
 * impression than no dashboard.
 *
 * The surface is the house ink panel — a near-black slate used on the light page as well as the
 * dark one — which is most of what makes the two products read as siblings.
 *
 * Two things this strip used to do and no longer does, both because the round above it is the
 * product and this is the read-out beside it:
 *
 * - **No "Review X" button.** It pointed at a MODULE while the board above pointed at a PATIENT,
 *   so the screen offered two primary actions ranked off one review ladder. `RoundBoard`'s
 *   "Start round" is the single action now.
 * - **No streak.** "N days in a row" is loss aversion wearing a lab coat, and it is the device the
 *   rest of this app refuses: `StudyReport`'s prescriptions deliberately never expire, and
 *   `currentStreak`'s own leniency exists so a missed day does not punish. `ProgressStore.streak()`
 *   is untouched — this removes a display, not a capability.
 */
import { StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, useAppTheme } from './theme';

export interface StudyStripProps {
  dueCount: number;
  /** Questions retained, and how many there are in total. An absolute count rather than a
   *  percentage: two out of a hundred and sixteen rounds to zero, and a returning learner who has
   *  just done real work should not be told they have made none. */
  known: number;
  totalQuestions: number;
  attempted: number;
}

export function StudyStrip({ dueCount, known, totalQuestions, attempted }: StudyStripProps) {
  const { color } = useAppTheme();

  if (attempted === 0) return null;

  return (
    <View
      style={[styles.strip, { backgroundColor: color.brandInk, borderColor: color.brandInkBorder }]}
      accessibilityLabel="Study progress"
    >
      <View style={styles.stats}>
        <Stat value={String(dueCount)} label="due today" emphasis={color.brandOnInk} />
        <View style={[styles.divider, { backgroundColor: color.brandInkBorder }]} />
        <Stat value={String(known)} suffix={`/${totalQuestions}`} label="known" />
      </View>

      {dueCount === 0 && (
        <Text style={[styles.caughtUp, { color: color.brandInkDim }]}>
          {known === totalQuestions
            ? 'Every question retained. Nothing due.'
            : 'Nothing due — you are caught up for today.'}
        </Text>
      )}
    </View>
  );
}

function Stat({
  value,
  suffix,
  label,
  emphasis,
}: {
  value: string;
  suffix?: string;
  label: string;
  emphasis?: string;
}) {
  const { color } = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: emphasis ?? color.onBrandInk }]}>
        {value}
        {suffix && <Text style={[styles.statOf, { color: color.brandInkDim }]}>{suffix}</Text>}
      </Text>
      <Text style={[styles.statLabel, { color: color.brandInkDim }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    gap: SPACE.lg,
  },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // Centred rather than left-aligned: the labels are different widths, and against a shared
  // left edge the divider between them lands at an arbitrary distance from each.
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: 2 },
  statValue: { fontSize: FONT.xxl, fontWeight: '700' },
  statOf: { fontSize: FONT.base, fontWeight: '400' },
  statLabel: { fontSize: FONT.micro, fontWeight: '600', textAlign: 'center' },
  caughtUp: { fontSize: FONT.sm, textAlign: 'center' },
});
