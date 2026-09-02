import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { ReadoutSpec } from './types';

/* ------------------------------------------------------------------ */
/*  Colour token resolution (matches DiagramView palette)              */
/* ------------------------------------------------------------------ */

const TOKEN_PALETTE: Record<string, string> = {
  artery: '#dc2626',
  vein: '#3b82f6',
  glucose: '#22c55e',
  insulin: '#eab308',
  glucagon: '#f97316',
  epinephrine: '#ef4444',
  text: '#64748b',
  kidney: '#8b5cf6',
  kidneyDark: '#6d28d9',
  o2: '#3b82f6',
  co2: '#64748b',
  ph: '#ec4899',
  bicarbonate: '#06b6d4',
  raas: '#ef4444',
  anp: '#06b6d4',
  sarcomere: '#8b5cf6',
  venous: '#3b82f6',
};

function resolveColor(token?: string): string | undefined {
  if (!token) return undefined;
  return TOKEN_PALETTE[token];
}

/* ------------------------------------------------------------------ */
/*  Readout tile                                                       */
/* ------------------------------------------------------------------ */

interface ReadoutTileProps {
  label: string;
  value: string;
  unit?: string;
  secondary?: string;
  colorToken?: string;
  wide?: boolean;
}

function ReadoutTile({ label, value, unit, secondary, colorToken, wide }: ReadoutTileProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = resolveColor(colorToken);

  return (
    <View style={[styles.tile, wide && styles.tileWide, isDark && styles.tileDark]}>
      <Text style={[styles.tileLabel, isDark && styles.tileLabelDark]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.tileValue, isDark && styles.textLight]}>
          {value}
        </Text>
        {unit && <Text style={[styles.tileUnit, isDark && styles.tileUnitDark]}>{unit}</Text>}
      </View>
      {secondary && (
        <Text style={[styles.tileSecondary, isDark && styles.tileSecondaryDark]}>{secondary}</Text>
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
}

export function ReadoutGridView<State, Derived, Inputs>({
  readouts,
  ctx,
}: ReadoutGridViewProps<State, Derived, Inputs>) {
  return (
    <View style={styles.grid}>
      {readouts.map((spec) => {
        const value = ctx ? spec.value(ctx) : '—';
        const secondary = ctx ? spec.secondary?.(ctx) : undefined;
        return (
          <ReadoutTile
            key={spec.label}
            label={spec.label}
            value={value}
            unit={spec.unit}
            secondary={secondary}
            colorToken={spec.colorToken}
            wide={spec.wide}
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
