import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { ReadoutSpec } from './types';
import { lookupColor } from './palette';

/* ------------------------------------------------------------------ */
/*  Readout tile                                                       */
/* ------------------------------------------------------------------ */

/**
 * Formats the set point to the precision the tile is already showing, so the disclosure only
 * appears when the two differ at a precision a reader can actually see. Mirrors `setPointHint`
 * in the web's ReadoutItem.
 *
 * Several controls set a quantity the body then modifies, so the number under the slider and the
 * number in the tile are genuinely different readings of the same thing: an intrinsic rate of 110
 * arrives as a heart rate of 106 once sympathetic and vagal drive are applied. Without this the
 * pair reads as a bug; with it, the gap is the teaching.
 */
function setPointHint(value: string, setPoint: number | undefined): string | undefined {
  if (setPoint === undefined) return undefined;
  const decimals = value.split('.')[1]?.replace(/\D.*$/, '').length ?? 0;
  const formatted = setPoint.toFixed(decimals);
  return formatted === value.replace(/[^\d.-]/g, '') ? undefined : `slider: ${formatted}`;
}

interface ReadoutTileProps {
  label: string;
  value: string;
  unit?: string;
  secondary?: string;
  colorToken?: string;
  wide?: boolean;
  /** This tile names the pattern the model has settled into, so it goes blank while a
   * pattern-discrimination question is still unanswered. */
  withheld?: boolean;
}

function ReadoutTile({ label, value, unit, secondary, colorToken, wide, withheld }: ReadoutTileProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = lookupColor(colorToken);

  return (
    <View style={[styles.tile, wide && styles.tileWide, isDark && styles.tileDark]}>
      <Text style={[styles.tileLabel, isDark && styles.tileLabelDark]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.tileValue, isDark && styles.textLight]}>
          {withheld ? '—' : value}
        </Text>
        {unit && !withheld && <Text style={[styles.tileUnit, isDark && styles.tileUnitDark]}>{unit}</Text>}
      </View>
      {withheld ? (
        <Text style={[styles.tileSecondary, isDark && styles.tileSecondaryDark]}>
          you are naming this one
        </Text>
      ) : (
        secondary !== undefined &&
        secondary !== '' && (
          <Text style={[styles.tileSecondary, isDark && styles.tileSecondaryDark]}>{secondary}</Text>
        )
      )}
      {accent && <View style={[styles.accentBar, { backgroundColor: accent }]} />}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Readout grid                                                       */
/* ------------------------------------------------------------------ */

interface ReadoutGridViewProps<State, Derived, Inputs> {
  readouts: readonly ReadoutSpec<State, Derived, Inputs>[];
  ctx?: { state: State; derived: Derived; inputs: Inputs };
  /**
   * True while a pattern-discrimination question in this module is still unanswered, which
   * withholds every readout marked `revealsPattern`.
   *
   * Without it the exercise answers itself: shockStates asks "which of these fits what you are
   * seeing?" above four options, while a tile labelled PATTERN reads "hypovolaemic".
   *
   * The web withholds these for the duration of a question inside a practice session and locks
   * the preset bar alongside. This screen has no session — every question is on the page at once
   * — so the tile stays withheld until the learner has committed an answer, and the preset bar
   * is left unlocked, because locking it here would block exploration indefinitely rather than
   * for the length of one question.
   */
  blinded?: boolean;
}

export function ReadoutGridView<State, Derived, Inputs>({
  readouts,
  ctx,
  blinded = false,
}: ReadoutGridViewProps<State, Derived, Inputs>) {
  return (
    <View style={styles.grid}>
      {readouts.map((spec) => {
        const value = ctx ? spec.value(ctx) : '—';
        // Both, when both apply: the note the module wrote and the slider it drifted from.
        const secondary = ctx
          ? [spec.secondary?.(ctx), setPointHint(value, spec.setPoint?.(ctx))].filter(Boolean).join(' · ')
          : undefined;
        return (
          <ReadoutTile
            key={spec.label}
            label={spec.label}
            value={value}
            unit={spec.unit}
            secondary={secondary}
            colorToken={spec.colorToken}
            wide={spec.wide}
            withheld={blinded && spec.revealsPattern === true}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%' as unknown as number,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  tileWide: { width: '100%' as unknown as number },
  tileDark: { backgroundColor: '#1e293b' },
  tileLabel: { fontSize: 12, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  tileLabelDark: { color: '#94a3b8' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tileValue: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  tileUnit: { fontSize: 13, color: '#94a3b8' },
  tileUnitDark: { color: '#64748b' },
  tileSecondary: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  tileSecondaryDark: { color: '#64748b' },
  textLight: { color: '#e2e8f0' },
  accentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
});
