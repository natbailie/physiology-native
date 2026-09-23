import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RoundBed } from '../home/useRound';
import type { RoundWalk } from './useRoundWalk';
import { FONT, SPACE, TAP, useAppTheme } from './theme';

/**
 * Previous patient · position · next patient, under the module's tab strip. The phone's half of
 * the web's `src/shared/components/RoundWalkBar/RoundWalkBar.tsx`.
 *
 * It sits OUTSIDE `CaseHeader`, which is where it started, because the walk is navigation around
 * the ROUND while the case header is the Lab tab's statement of whose physiology the sliders
 * belong to. The case header renders on Lab only — and opening a bed lands on the PATIENTS tab,
 * so a walk inside it was missing from the one tab the round actually opens.
 *
 * Names rather than "Previous" and "Next": the name is what tells a learner whether the step is
 * worth taking, and it is the same currency the round board used. The ends say so rather than
 * vanishing — a control that disappears at the edge leaves the learner wondering whether they
 * mis-pressed.
 */
export function RoundWalkBar({
  walk,
  accent,
  onWalk,
}: {
  walk: RoundWalk;
  accent: string;
  /** Routes to a neighbouring bed. Injected so tests never need a router. */
  onWalk: (bed: RoundBed) => void;
}) {
  const { color } = useAppTheme();
  if (walk.position === null || (!walk.previous && !walk.next)) return null;

  return (
    <View style={[styles.walk, { borderBottomColor: color.panelBorder, backgroundColor: color.panel }]}>
      {walk.previous ? (
        <Pressable
          onPress={() => onWalk(walk.previous!)}
          accessibilityRole="link"
          accessibilityLabel={`Previous patient: ${walk.previous.name}`}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={[styles.link, { color: accent }]}>← {walk.previous.name}</Text>
        </Pressable>
      ) : (
        <Text style={[styles.end, { color: color.textFaint }]}>First on the round</Text>
      )}

      <Text style={[styles.position, { color: color.textDim }]}>
        {walk.position} of {walk.total}
      </Text>

      {walk.next ? (
        <Pressable
          onPress={() => onWalk(walk.next!)}
          accessibilityRole="link"
          accessibilityLabel={`Next patient: ${walk.next.name}`}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={[styles.link, { color: accent }]}>{walk.next.name} →</Text>
        </Pressable>
      ) : (
        <Text style={[styles.end, { color: color.textFaint }]}>Last on the round</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  walk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    flexWrap: 'wrap',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    minHeight: TAP,
  },
  link: { fontSize: FONT.xs, fontWeight: '700' },
  end: { fontSize: FONT.xs },
  position: { fontSize: FONT.xs, fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.6 },
});
