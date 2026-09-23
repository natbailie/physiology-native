import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ReadoutSpec } from './types';
import { ReadoutTile } from './ReadoutTile';
import { SPACE } from './theme';

/* ------------------------------------------------------------------ */
/*  Readout grid                                                       */
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

interface ReadoutGridViewProps<State, Derived, Inputs> {
  readouts: readonly ReadoutSpec<State, Derived, Inputs>[];
  ctx?: { state: State; derived: Derived; inputs: Inputs };
  /** The module these readouts belong to, for the module-scoped half of the glossary. */
  moduleId?: string;
  /**
   * True while a pattern-discrimination question in this module is still unanswered, which
   * withholds every readout marked `revealsPattern`.
   *
   * Without it the exercise answers itself: shockStates asks "which of these fits what you are
   * seeing?" above four options, while a tile labelled PATTERN reads "hypovolaemic".
   *
   * Derived on the module screen from the committed answers and read here as a prop, so it
   * survives tab switches that unmount every question row. The screen locks the scenario bar
   * alongside it, the way the web's preset bar locks: loading another scenario mid-question
   * would replace the one being asked about.
   */
  blinded?: boolean;
}

export function ReadoutGridView<State, Derived, Inputs>({
  readouts,
  ctx,
  moduleId,
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
            moduleId={moduleId}
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
    gap: SPACE.md,
  },
});
