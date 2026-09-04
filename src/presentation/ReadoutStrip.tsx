/**
 * The two or three numbers that must stay on screen while a control is being dragged.
 *
 * The module screen was one long ScrollView with the control rail BELOW the readout grid, so on a
 * phone the slider and the number it moves were never visible at the same time. That is the whole
 * proposition of a feedback-loop simulator, and it was the one thing the layout made impossible.
 * The web never had the problem: it is a two-column desktop layout, with the rail beside the
 * readouts rather than under them.
 *
 * So the grid keeps its place and a condensed copy of the first few readouts is pinned above the
 * scroll instead. Which few is the module's own decision, not this component's: a presentation
 * lists its readouts in the order they matter, so the first three are the three a module would
 * choose. `wide` marks a module's headline readout, and those sort first when any exist.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { ReadoutSpec } from './types';
import { lookupColor } from './palette';
import { FONT, SPACE, useAppTheme } from './theme';

/** Three fits a 390pt screen at a readable size. A fourth column starts truncating labels. */
const SLOTS = 3;

interface ReadoutStripProps<State, Derived, Inputs> {
  readouts: readonly ReadoutSpec<State, Derived, Inputs>[];
  ctx?: { state: State; derived: Derived; inputs: Inputs };
  blinded?: boolean;
}

export function ReadoutStrip<State, Derived, Inputs>({
  readouts,
  ctx,
  blinded = false,
}: ReadoutStripProps<State, Derived, Inputs>) {
  const { scheme, color } = useAppTheme();

  // `wide` is how a presentation marks its headline readout, so those lead. Stable within each
  // group, which keeps the module's own ordering intact behind the promotion.
  const chosen = [...readouts]
    .sort((a, b) => Number(b.wide ?? false) - Number(a.wide ?? false))
    .slice(0, SLOTS);

  if (chosen.length === 0) return null;

  return (
    <View style={[styles.strip, { backgroundColor: color.panel, borderBottomColor: color.panelBorder }]}>
      {chosen.map((spec) => {
        const withheld = blinded && spec.revealsPattern === true;
        const accent = lookupColor(spec.colorToken, scheme);
        return (
          <View key={spec.label} style={styles.cell}>
            <Text numberOfLines={1} style={[styles.label, { color: color.textFaint }]}>
              {spec.label}
            </Text>
            <View style={styles.valueRow}>
              <Text numberOfLines={1} style={[styles.value, { color: accent ?? color.text }]}>
                {withheld || !ctx ? '—' : spec.value(ctx)}
              </Text>
              {spec.unit && !withheld && (
                <Text style={[styles.unit, { color: color.textFaint }]}>{spec.unit}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xl,
    gap: SPACE.lg,
  },
  cell: { flex: 1, gap: 1 },
  label: { fontSize: FONT.micro, textTransform: 'uppercase', letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  value: { fontSize: FONT.lg, fontWeight: '700' },
  unit: { fontSize: FONT.micro },
});
