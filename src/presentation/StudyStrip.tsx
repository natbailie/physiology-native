/**
 * What a returning learner sees first. A port of the web's `src/home/StudyStrip.tsx`.
 *
 * Deliberately absent until they have answered something: a dashboard of zeroes is a worse first
 * impression than no dashboard, and the point of the strip is to be the reason someone opens the
 * app on a given morning — which it cannot be for a person who has never used it.
 *
 * The native app had a version of this already, as three facts joined by middots in grey text on
 * the page ground. The web's is the house ink surface — a near-black slate panel used on the light
 * page as well as the dark one — with the due count as a display figure and a filled action next
 * to it. That surface is most of what makes the two products read as siblings, so it is what this
 * renders now.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, TAP, useAppTheme } from './theme';

export interface StudyStripProps {
  dueCount: number;
  streakDays: number;
  /** Questions retained, and how many there are in total. An absolute count rather than a
   *  percentage: two out of a hundred and sixteen rounds to zero, and a returning learner who has
   *  just done real work should not be told they have made none. */
  known: number;
  totalQuestions: number;
  attempted: number;
  reviewModuleId: string | null;
  reviewModuleName: string | null;
  onReview: (moduleId: string) => void;
}

export function StudyStrip({
  dueCount,
  streakDays,
  known,
  totalQuestions,
  attempted,
  reviewModuleId,
  reviewModuleName,
  onReview,
}: StudyStripProps) {
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
        <Stat value={String(streakDays)} label={`day${streakDays === 1 ? '' : 's'} in a row`} />
        <View style={[styles.divider, { backgroundColor: color.brandInkBorder }]} />
        <Stat value={String(known)} suffix={`/${totalQuestions}`} label="known" />
      </View>

      {dueCount > 0 && reviewModuleId ? (
        <Pressable
          onPress={() => onReview(reviewModuleId)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: color.brand },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.actionText, { color: color.onSolid }]} numberOfLines={1}>
            Review {reviewModuleName}
          </Text>
        </Pressable>
      ) : (
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
  // Centred rather than left-aligned: the three labels are different widths, and against a shared
  // left edge the dividers between them land at three different distances.
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: 2 },
  statValue: { fontSize: FONT.xxl, fontWeight: '700' },
  statOf: { fontSize: FONT.base, fontWeight: '400' },
  statLabel: { fontSize: FONT.micro, fontWeight: '600', textAlign: 'center' },
  action: {
    minHeight: TAP,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  actionText: { fontSize: FONT.sm, fontWeight: '700' },
  caughtUp: { fontSize: FONT.sm, textAlign: 'center' },
});
