import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { lookupColor } from './palette';
import { useTermSheet } from './TermSheet';
import { FONT, RADIUS, SPACE, useAppTheme } from './theme';

export interface ReadoutTileProps {
  label: string;
  /** The module printing this tile, so a label it owns wins over the shared definition. */
  moduleId?: string;
  value: string;
  unit?: string;
  secondary?: string;
  colorToken?: string;
  wide?: boolean;
  /** This tile names the pattern the model has settled into, so it goes blank while a
   * pattern-discrimination question is still unanswered. */
  withheld?: boolean;
}

/**
 * One instrument tile: micro-label, large mono numeral, unit and note, on the readout ink.
 *
 * Extracted from `ReadoutGridView`, which used to own it privately — the bedside chart and the
 * Questions instrument read the same way, and a second (then third) copy is how the web's tile
 * and this one drifted in the first place. The grid keeps its layout and its set-point hint;
 * everything a tile is lives here.
 */
export function ReadoutTile({ label, moduleId, value, unit, secondary, colorToken, wide, withheld }: ReadoutTileProps) {
  const { scheme, color } = useAppTheme();
  const accent = lookupColor(colorToken, scheme);
  const terms = useTermSheet();
  // Only a label the glossary can actually explain becomes a button. An undefined term stays a
  // plain tile rather than a control that opens nothing — the same fall-through the web's
  // `<Term>` has.
  const explainable = terms.has(label, moduleId);

  return (
    <Pressable
      onPress={explainable ? () => terms.open(label, moduleId) : undefined}
      disabled={!explainable}
      accessibilityRole={explainable ? 'button' : undefined}
      accessibilityHint={explainable ? `Explains what ${label} measures` : undefined}
      style={({ pressed }) => [
        styles.tile,
        wide && styles.tileWide,
        { backgroundColor: color.readoutInk, borderColor: color.readoutInkBorder },
        pressed && explainable && { opacity: 0.8 },
      ]}
    >
      <View style={styles.labelRow}>
        <Text style={[styles.tileLabel, { color: color.readoutInkDim }]} numberOfLines={2}>
          {label}
        </Text>
        {/* The affordance. The web underlines its `<Term>` trigger and this started as the same
            dotted rule, which iOS does not draw at all — React Native ignores a border style set
            on one side only, so the tiles shipped looking exactly as they had before. A glyph is
            what the platform uses for this anyway, and it survives the label wrapping to two
            lines, which an underline did not. */}
        {explainable && (
          <Ionicons
            name="information-circle-outline"
            size={13}
            color={color.textFaint}
            style={styles.labelHint}
          />
        )}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.tileValue, { color: accent ?? color.onReadoutInk }]}>{withheld ? '—' : value}</Text>
        {unit && !withheld && <Text style={[styles.tileUnit, { color: color.readoutInkDim }]}>{unit}</Text>}
      </View>
      {withheld ? (
        <Text style={[styles.tileSecondary, { color: color.readoutInkDim }]}>you are naming this one</Text>
      ) : (
        secondary !== undefined &&
        secondary !== '' && (
          <Text style={[styles.tileSecondary, { color: color.readoutInkDim }]}>{secondary}</Text>
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%' as unknown as number,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  tileWide: { width: '100%' as unknown as number },
  labelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.xs, marginBottom: SPACE.xs },
  // Sentence case: the app stopped shouting its labels, and this table had not caught up.
  tileLabel: { flexShrink: 1, fontSize: FONT.micro, letterSpacing: 0.5 },
  // Nudged down to sit on the label's cap height rather than above it.
  labelHint: { marginTop: 1 },
  // Wraps so a long unit ("mL/100g/min") drops under the numeral rather than clipping at the tile edge.
  valueRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: SPACE.xs },
  tileValue: { fontSize: FONT.xl, fontWeight: '700' },
  tileUnit: { fontSize: FONT.xs },
  tileSecondary: { fontSize: FONT.micro, marginTop: SPACE.xs },
});
