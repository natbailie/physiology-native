/**
 * The pill on a card — "Coming soon", "Full access", "Reference".
 *
 * One component because the web's three `.badge` rules are the same rule, and the only variant
 * that differs is the locked one, which strengthens rather than dims: a locked module has to look
 * worth buying, and a half-opacity tile does not sell anything.
 *
 * `tone` tints the chip in a signal colour — the ward round's acuity chips and the bed picker's
 * — following the web's `.acuity` rule: the WORD carries the meaning and colour is second, so
 * the label stays mandatory.
 *
 * **A toned chip has no fill.** It used to wash its background in `withAlpha(tone, 0.12)`, and
 * `withAlpha` is translucent, so the chip was never on the ground it was calibrated against —
 * it was on 12% of itself over whatever sat behind. On a card that cost about 0.7 of contrast
 * and put light DUE at 4.17:1, under the 4.5 small-text floor this 11pt label needs. On the bed
 * picker's SELECTED bed, which is filled with the module accent, it was catastrophic: every
 * acuity word landed between 1.00 and 1.60:1 against its own background, and because
 * gastrointestinal's accent IS `--danger`, CRASH there rendered at exactly 1.00:1 — the word
 * painted in its own background colour. The border and the word are what make it a chip;
 * dropping the fill restores the web's own numbers (4.86-8.41:1) and lets a caller on a solid
 * fill simply pass `--on-solid` as the tone.
 */
import { StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, useAppTheme } from '../theme';

export function Badge({
  label,
  emphasised = false,
  tone,
}: {
  label: string;
  emphasised?: boolean;
  /** Hex colour the chip reads in. Absent keeps the neutral card pill. */
  tone?: string;
}) {
  const { color } = useAppTheme();
  if (tone) {
    return (
      <View style={[styles.badge, { borderColor: tone }]}>
        <Text style={[styles.text, { color: tone }]}>{label}</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color.panel, borderColor: emphasised ? color.textFaint : color.panelBorder },
      ]}
    >
      <Text style={[styles.text, { color: emphasised ? color.text : color.textFaint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 2,
    paddingHorizontal: SPACE.md,
  },
  text: { fontSize: FONT.micro, fontWeight: '600', letterSpacing: 0.6 },
});
