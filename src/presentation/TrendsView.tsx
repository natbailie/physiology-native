import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import type { ChartSpec, ChartContext, OdCurveSpec, SparklineSpec } from './types';
import { lookupColor, type ThemeName } from './palette';
import { FONT, RADIUS, SPACE, useAppTheme } from './theme';

/** A trace whose token has no colour falls back to the neutral text grey rather than to black:
 * a chart line is still readable in grey, and a black one reads as deliberate. */
function resolveColor(token: string | undefined, theme: ThemeName, def: string = '#64748b'): string {
  return lookupColor(token, theme) ?? def;
}

function useThemeName(): ThemeName {
  return useAppTheme().scheme;
}

/** The chart's own chrome — card, axes, title — which is not a schema colour, so it comes from
 *  the surface palette rather than from a hand-written pair of hex tables. */
function useChrome() {
  const { color } = useAppTheme();
  return { card: color.panel, border: color.panelBorder, axis: color.panelBorder, title: color.textDim };
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
  const theme = useThemeName();
  const chrome = useChrome();
  const values = spec.data(history);
  const baselineValues = spec.secondaryData
    ? spec.secondaryData(history)
    : baselineHistory && baselineHistory.length
      ? spec.data(baselineHistory)
      : null;
  const d = toPoints(values, spec.domainMin, spec.domainMax);
  const color = resolveColor(spec.colorToken, theme);
  const baselineColor = spec.secondaryColorToken
    ? resolveColor(spec.secondaryColorToken, theme)
    : resolveColor('baseline', theme);

  return (
    <View style={[styles.card, { backgroundColor: chrome.card, borderColor: chrome.border }]}>
      <Text style={[styles.chartTitle, { color: chrome.title }]}>{spec.label}{spec.unit ? ` (${spec.unit})` : ''}</Text>
      {/* The viewBox keeps every coordinate above in its own 220x90 space; only the box the SVG
          is painted into changes. The plot used to be laid out at a literal 220pt, so on a 402pt
          screen each chart filled a little over half the card and the rest was blank. */}
      <View style={styles.plot}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}>
        <Line x1={PAD_X} y1={PAD_Y} x2={PLOT_W - PAD_X} y2={PAD_Y} stroke={chrome.axis} strokeWidth={1} />
        <Line x1={PAD_X} y1={PLOT_H - PAD_Y} x2={PLOT_W - PAD_X} y2={PLOT_H - PAD_Y} stroke={chrome.axis} strokeWidth={1} />
        {baselineValues && baselineValues.length > 1 && (
          <Path d={toPoints(baselineValues, spec.domainMin, spec.domainMax)} stroke={baselineColor} strokeWidth={1.5} fill="none" opacity={0.55} strokeDasharray="3,3" />
        )}
        {d && <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />}
      </Svg>
      </View>
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
  const theme = useThemeName();
  const chrome = useChrome();
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
  const color = resolveColor(spec.colorToken, theme);

  return (
    <View style={[styles.card, { backgroundColor: chrome.card, borderColor: chrome.border }]}>
      {/* The web titles these the same way, from the spec rather than a constant: an od-curve
          is not always the oxygen curve (muscleContraction plots length-tension and
          force-velocity through the same spec). */}
      <Text style={[styles.chartTitle, { color: chrome.title }]}>{spec.yLabel} vs {spec.xLabel}</Text>
      <View style={styles.plot}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}>
        <Line x1={PAD_X} y1={PLOT_H - PAD_Y} x2={PLOT_W - PAD_X} y2={PLOT_H - PAD_Y} stroke={chrome.axis} strokeWidth={1} />
        <Line x1={PAD_X} y1={PAD_Y} x2={PAD_X} y2={PLOT_H - PAD_Y} stroke={chrome.axis} strokeWidth={1} />
        <Path d={samples.join(' ')} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Circle cx={cx} cy={cy} r={4.5} fill={color} />
        <SvgText x={PAD_X} y={PLOT_H - 2} fontSize={8} fill={chrome.title}>{spec.xLabel}</SvgText>
        <SvgText x={2} y={PAD_Y + 6} fontSize={8} fill={chrome.title}>{spec.yLabel}</SvgText>
      </Svg>
      </View>
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
  // Stacked full width rather than a wrapping row. The cards used to size to a literal 220pt
  // plot, so on a phone one fitted per row and the rest of the row was empty.
  container: { gap: SPACE.md },
  card: {
    width: '100%' as unknown as number,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    gap: SPACE.xs,
  },
  plot: { width: '100%' as unknown as number, aspectRatio: PLOT_W / PLOT_H },
  chartTitle: {
    fontSize: FONT.micro,
    fontWeight: '600',
  },
});
