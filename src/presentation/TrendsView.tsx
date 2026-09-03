import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import type { ChartSpec, ChartContext, OdCurveSpec, SparklineSpec } from './types';
import { lookupColor } from './palette';

/** A trace whose token has no colour falls back to the neutral text grey rather than to black:
 * a chart line is still readable in grey, and a black one reads as deliberate. */
function resolveColor(token?: string, def: string = '#64748b'): string {
  return lookupColor(token) ?? def;
}

/* ------------------------------------------------------------------ */
/*  Shared plot geometry                                                */
/* ------------------------------------------------------------------ */

const PLOT_W = 220;
const PLOT_H = 90;
const PAD_X = 6;
const PAD_Y = 8;

function toPoints(values: number[], domainMin: number, domainMax: number): string {
  if (values.length === 0) return '';
  const n = values.length;
  const span = domainMax - domainMin || 1;
  return values
    .map((v, i) => {
      const x = PAD_X + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * (PLOT_W - 2 * PAD_X));
      const clamped = Math.max(domainMin, Math.min(domainMax, v));
      const y = PAD_Y + (1 - (clamped - domainMin) / span) * (PLOT_H - 2 * PAD_Y);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/* ------------------------------------------------------------------ */
/*  Sparkline                                                           */
/* ------------------------------------------------------------------ */

interface SparklineProps<History> {
  spec: SparklineSpec<History>;
  history: readonly History[];
  baselineHistory: readonly History[] | null;
}

function Sparkline<History>({ spec, history, baselineHistory }: SparklineProps<History>) {
  const values = spec.data(history);
  const baselineValues = spec.secondaryData
    ? spec.secondaryData(history)
    : baselineHistory && baselineHistory.length
      ? spec.data(baselineHistory)
      : null;
  const d = toPoints(values, spec.domainMin, spec.domainMax);
  const color = resolveColor(spec.colorToken);
  const baselineColor =
    spec.secondaryColorToken ? resolveColor(spec.secondaryColorToken) : resolveColor('baseline', '#94a3b8');

  return (
    <View style={styles.card}>
      <Text style={styles.chartTitle}>{spec.label}{spec.unit ? ` (${spec.unit})` : ''}</Text>
      <Svg width={PLOT_W} height={PLOT_H} viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}>
        <Line x1={PAD_X} y1={PAD_Y} x2={PLOT_W - PAD_X} y2={PAD_Y} stroke="#e2e8f0" strokeWidth={1} />
        <Line x1={PAD_X} y1={PLOT_H - PAD_Y} x2={PLOT_W - PAD_X} y2={PLOT_H - PAD_Y} stroke="#e2e8f0" strokeWidth={1} />
        {baselineValues && baselineValues.length > 1 && (
          <Path d={toPoints(baselineValues, spec.domainMin, spec.domainMax)} stroke={baselineColor} strokeWidth={1.5} fill="none" opacity={0.55} strokeDasharray="3,3" />
        )}
        {d && <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />}
      </Svg>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  OD curve                                                            */
/* ------------------------------------------------------------------ */

interface OdCurveProps<Derived> {
  spec: OdCurveSpec<Derived>;
  derived: Derived;
}

function OdCurve<Derived>({ spec, derived }: OdCurveProps<Derived>) {
  const [xMin, xMax] = spec.xDomain;
  const [yMin, yMax] = spec.yDomain;
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  const px = (x: number) => PAD_X + ((x - xMin) / xSpan) * (PLOT_W - 2 * PAD_X);
  const py = (y: number) => PAD_Y + (1 - (y - yMin) / ySpan) * (PLOT_H - 2 * PAD_Y);

  const samples: string[] = [];
  const STEPS = 60;
  for (let i = 0; i <= STEPS; i++) {
    const x = xMin + (i / STEPS) * xSpan;
    const y = Math.max(yMin, Math.min(yMax, spec.curveFn(x)));
    samples.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(y).toFixed(1)}`);
  }

  const ctx: ChartContext<Derived> = { derived };
  const cx = px(Math.max(xMin, Math.min(xMax, spec.currentX(ctx))));
  const cy = py(Math.max(yMin, Math.min(yMax, spec.currentY(ctx))));
  const color = resolveColor(spec.colorToken);

  return (
    <View style={styles.card}>
      <Text style={styles.chartTitle}>O2-Hb dissociation</Text>
      <Svg width={PLOT_W} height={PLOT_H} viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}>
        <Line x1={PAD_X} y1={PLOT_H - PAD_Y} x2={PLOT_W - PAD_X} y2={PLOT_H - PAD_Y} stroke="#cbd5e1" strokeWidth={1} />
        <Line x1={PAD_X} y1={PAD_Y} x2={PAD_X} y2={PLOT_H - PAD_Y} stroke="#cbd5e1" strokeWidth={1} />
        <Path d={samples.join(' ')} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Circle cx={cx} cy={cy} r={4.5} fill={color} />
        <SvgText x={PAD_X} y={PLOT_H - 2} fontSize={8} fill="#94a3b8">{spec.xLabel}</SvgText>
        <SvgText x={2} y={PAD_Y + 6} fontSize={8} fill="#94a3b8">{spec.yLabel}</SvgText>
      </Svg>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  TrendsView                                                          */
/* ------------------------------------------------------------------ */

interface TrendsViewProps<History, Derived> {
  charts: readonly ChartSpec<History, Derived>[];
  history: readonly History[];
  baselineHistory: readonly History[] | null;
  derived: Derived;
}

export function TrendsView<History, Derived>({
  charts,
  history,
  baselineHistory,
  derived,
}: TrendsViewProps<History, Derived>) {
  return (
    <View style={styles.container}>
      {charts.map((chart, i) =>
        chart.kind === 'sparkline' ? (
          <Sparkline key={chart.label ?? i} spec={chart} history={history} baselineHistory={baselineHistory} />
        ) : (
          <OdCurve key={i} spec={chart} derived={derived} />
        ),
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  chartTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
});
