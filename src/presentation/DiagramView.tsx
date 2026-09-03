import React from 'react';
import { useColorScheme } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Marker,
  Path,
  Rect,
  Text as SvgText,
  type FontStyle,
} from 'react-native-svg';
import type { FrameNode, SceneNode } from './types';
import { renderOrgan } from './organs';
import { resolveColor, type ThemeName } from './palette';

/* ------------------------------------------------------------------ */
/*  CSS-class-aware styling (the web renders `cls` via CSS modules)    */
/* ------------------------------------------------------------------ */

/**
 * The schema's `cls` strings name the class the web applies through a CSS module. On native there
 * is no CSS, so each class resolves to inline stroke/fill/weight here. Unknown classes fall back
 * to sensible generic values rather than erroring, so a newly-authored diagram degrades gracefully.
 */
interface ClsStyle {
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: FontStyle;
  opacity?: number;
  dash?: string;
}

/**
 * The diagram classes, as token names rather than hex.
 *
 * The web resolves `cls` through CSS: the eleven shared text classes in
 * `shared/styles/diagramText.module.css`, plus each module's own `Diagram.module.css`. Native has
 * no cascade, so the shared sheet is transcribed here and resolved per theme — holding light hex
 * directly, as this did, meant every one of these drew in light-mode ink on the dark background.
 *
 * This covers the SHARED sheet. The per-module classes (`chamber`, `tissue`, `tank`, ...) are not
 * here: 52 of the 72 `cls` values the presentations use come from a module's own stylesheet, many
 * of them through `color-mix()` and the `styleVars` custom properties, and porting those is its
 * own piece of work. A class with no entry simply goes unstyled.
 */
const CLS_TOKENS: Record<string, Omit<ClsStyle, 'stroke' | 'fill'> & { stroke?: string; fill?: string }> = {
  /* --- the shared diagramText sheet --- */
  anatomy: { fill: 'text-dim', fontSize: 11, fontWeight: '500' },
  anatomyStrong: { fill: 'text', fontSize: 12, fontWeight: '600' },
  axis: { stroke: 'panel-border', strokeWidth: 1 },
  tickLabel: { fill: 'text-faint', fontSize: 9 },
  label: { fill: 'text-dim', fontSize: 11 },
  caption: { fill: 'text-faint', fontSize: 11 },
  organLabel: { fill: 'text', fontSize: 11, fontWeight: '600' },
  pathLabel: { fill: 'text-dim', fontSize: 9 },
  valueLabel: { fill: 'text', fontSize: 9 },
  alarm: { fill: 'danger', fontSize: 12 },
  verdict: { fill: 'text', fontSize: 9, fontWeight: '600' },

  /* --- native-only plot chrome, for the charts drawn inside a diagram frame --- */
  verdictMixed: { fill: 'danger', fontSize: 9, fontWeight: '600' },
  plotGrid: { stroke: 'grid-line', strokeWidth: 1 },
  plotAxis: { stroke: 'text-faint', strokeWidth: 1.2 },
  axisLabel: { fill: 'text-faint', fontSize: 8 },
  isopleth: { stroke: 'co2', strokeWidth: 1, dash: '3,4', opacity: 0.5 },
  isoplethLabel: { fill: 'co2', fontSize: 7, opacity: 0.85 },
  bufferLine: { stroke: 'bicarb', strokeWidth: 1.6, opacity: 0.75 },
  // The normal-status marker is a hollow dashed ring, not a disc — it marks where a healthy
  // person sits so the live point can be read against it, and a filled marker would compete
  // with the live point for the eye.
  normalPoint: { fill: 'none', stroke: 'text-faint', strokeWidth: 1.2, dash: '2,2' },
  livePoint: { fill: 'ph', stroke: 'panel', strokeWidth: 1.5 },
  trail: { stroke: 'ph', strokeWidth: 1.6, fill: 'none', opacity: 0.45 },
  baselineTrail: { stroke: 'text-faint', strokeWidth: 1.4, fill: 'none', dash: '3,3', opacity: 0.55 },
  regionLabel: { fill: 'text-faint', fontSize: 7, opacity: 0.85 },
};


function clsStyle(cls: string | undefined, theme: ThemeName): ClsStyle {
  if (!cls) return {};
  const spec = CLS_TOKENS[cls];
  if (!spec) return {};
  return {
    ...spec,
    stroke: spec.stroke === undefined ? undefined : resolveColor(spec.stroke, theme),
    fill: spec.fill === undefined || spec.fill === 'none' ? spec.fill : resolveColor(spec.fill, theme),
  };
}

/**
 * An absent fill is `none`, never a colour. The schema's paths are overwhelmingly stroke-only —
 * isopleths, trails, buffer lines — and the web gets `fill: none` for them from the CSS module.
 * (`colorToken` is the stroke colour, as on the web, never the fill.)
 *
 * `resolveColor` answers `#000000` for a token it does not know, which is a reasonable last
 * resort for a stroke and a disaster for a fill: 38 of the 97 rect nodes across the module
 * presentations carry no `fill` of their own, and every one of them drew as a solid black block
 * — shockStates rendered both heart chambers as filled squares over the circuit behind them.
 * Paths already went through here; circles and rects now do too.
 */
function pathFill(fill: string | undefined, style: ClsStyle, theme: ThemeName): string {
  if (fill === 'none') return 'none';
  if (fill) return resolveColor(fill, theme);
  return style.fill ?? 'none';
}

/* ------------------------------------------------------------------ */
/*  Scene node renderer                                                */
/* ------------------------------------------------------------------ */

/** What every node needs from the frame around it: the active theme for colour resolution, and
 *  whether a pattern question is withholding its answer. */
interface RenderCtx {
  theme: ThemeName;
  blinded: boolean;
}

function renderNode(node: SceneNode, index: number, ctx: RenderCtx): React.ReactNode {
  switch (node.type) {
    /**
     * `presentation.ts` emits ordinary SVG transform strings and react-native-svg parses that
     * syntax itself, so the string is handed over untouched.
     *
     * It used to be parsed here into {translateX, translateY} and re-serialised as `"x, y"`,
     * which is not SVG transform syntax. react-native-svg rejected every one of them
     * ("Expected \"matrix\", \"rotate\", ...") and dropped the transform, so all 56
     * transformed groups drew on top of each other at the origin. The regex also matched only
     * `translate`, so `scale(0.72)`, `rotate(-52 136 186)` and `translate(13,0) scale(-1,1)`
     * were discarded even where the serialisation was not at fault.
     */
    case 'group': {
      return (
        <G key={index} transform={node.transform}>
          {node.children.map((child, i) => renderNode(child, i, ctx))}
        </G>
      );
    }

    case 'path': {
      const ps = clsStyle(node.cls, ctx.theme);
      return (
        <Path
          key={index}
          d={node.d}
          stroke={ps.stroke ?? resolveColor(node.colorToken, ctx.theme)}
          fill={pathFill(node.fill, ps, ctx.theme)}
          strokeWidth={ps.strokeWidth ?? node.strokeWidth ?? 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={ps.dash}
          opacity={ps.opacity}
          markerEnd={node.markerEnd ? `url(#${node.markerEnd})` : undefined}
          clipPath={node.clipPathId ? `url(#${node.clipPathId})` : undefined}
        />
      );
    }

    case 'circle': {
      const cs = clsStyle(node.cls, ctx.theme);
      return (
        <Circle
          key={index}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill={pathFill(node.fill, cs, ctx.theme)}
          stroke={cs.stroke}
          strokeWidth={cs.strokeWidth}
          strokeDasharray={cs.dash}
          opacity={cs.opacity}
        />
      );
    }

    case 'rect': {
      const rs = clsStyle(node.cls, ctx.theme);
      return (
        <Rect
          key={index}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          fill={pathFill(node.fill, rs, ctx.theme)}
          stroke={rs.stroke}
          strokeWidth={rs.strokeWidth}
          strokeDasharray={rs.dash}
          opacity={rs.opacity}
        />
      );
    }

    case 'line':
      return (
        <Line
          key={index}
          x1={node.x1}
          y1={node.y1}
          x2={node.x2}
          y2={node.y2}
          stroke={clsStyle(node.cls, ctx.theme).stroke ?? resolveColor(node.colorToken, ctx.theme)}
          strokeWidth={clsStyle(node.cls, ctx.theme).strokeWidth ?? 1}
          strokeDasharray={clsStyle(node.cls, ctx.theme).dash}
          opacity={clsStyle(node.cls, ctx.theme).opacity}
        />
      );

    case 'text': {
      /**
       * A `verdict` names the pattern the model has settled into, so it goes while a
       * pattern-discrimination question is unanswered — the web hides the same class through
       * `[data-blinded='true'] .verdict`. Only the verdict: the `label` line beside it lists the
       * findings, and reading the findings is the exercise rather than a way around it.
       */
      if (ctx.blinded && node.cls === 'verdict') return null;
      const ts = clsStyle(node.cls, ctx.theme);
      // Text with neither a class nor a colour token is body text, not black: the label
      // "Right heart" carries no colour of its own and resolved to #000000, invisible against
      // the dark theme's background.
      const textFill =
        ts.fill ??
        (node.colorToken ? resolveColor(node.colorToken, ctx.theme) : resolveColor('text', ctx.theme));
      return (
        <SvgText
          key={index}
          x={node.x}
          y={node.y}
          fill={textFill}
          fontSize={ts.fontSize ?? 12}
          fontWeight={ts.fontWeight}
          fontStyle={ts.fontStyle}
          textAnchor={
            node.anchor === 'middle' ? 'middle' :
            node.anchor === 'end' ? 'end' : 'start'
          }
          opacity={ts.opacity ?? node.opacity}
        >
          {node.text}
        </SvgText>
      );
    }

    case 'vessel':
      // Simplified: draw the static path; flow animation deferred to later
      return (
        <Path
          key={index}
          d={node.path}
          stroke={resolveColor(node.colorToken, ctx.theme)}
          strokeWidth={node.width ?? 2}
          fill="none"
          strokeLinecap="round"
          opacity={0.6}
        />
      );

    case 'axis':
      // Simplified: draw the path + label; dashed style deferred
      return (
        <G key={index}>
          <Path
            d={node.path}
            stroke={resolveColor(node.colorToken, ctx.theme)}
            strokeWidth={1.5}
            fill="none"
            strokeDasharray={node.inhibitory ? '4,4' : undefined}
            strokeLinecap="round"
            opacity={0.5 + node.activation * 0.5}
            markerEnd={`url(#${node.markerId})`}
          />
          <SvgText
            x={node.labelX}
            y={node.labelY}
            fill={resolveColor(node.colorToken, ctx.theme)}
            fontSize={10}
            textAnchor="middle"
          >
            {node.label}
          </SvgText>
        </G>
      );

    case 'organ':
      return renderOrgan(node.name, node.x, node.y, node.params, index);
  }
}

/* ------------------------------------------------------------------ */
/*  Frame renderer                                                     */
/* ------------------------------------------------------------------ */

interface DiagramViewProps {
  frame: FrameNode;
  /** True while a pattern-discrimination question is unanswered; withholds the verdict text. */
  blinded?: boolean;
}

export function DiagramView({ frame, blinded = false }: DiagramViewProps) {
  const theme: ThemeName = useColorScheme() === 'dark' ? 'dark' : 'light';
  const ctx: RenderCtx = { theme, blinded };
  const [vx, vy, vw, vh] = frame.viewBox;
  return (
    <Svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      accessibilityLabel={frame.ariaLabel}
      style={{ width: '100%', aspectRatio: vw / vh }}
    >
      {frame.defs && (
        <Defs>
          {frame.defs.map((def, i) => {
            if (def.type === 'marker') {
              return (
                <Marker
                  key={i}
                  id={def.id}
                  markerWidth={8}
                  markerHeight={8}
                  refX={6}
                  refY={4}
                  orient="auto"
                >
                  <Path d="M0,0 L8,4 L0,8 Z" fill={resolveColor(def.colorToken, theme)} />
                </Marker>
              );
            }
            if (def.type === 'clipPath') {
              return (
                <ClipPath key={i} id={def.id}>
                  {def.children.map((path, j) => (
                    <Path key={j} d={path.d} />
                  ))}
                </ClipPath>
              );
            }
            return null;
          })}
        </Defs>
      )}
      {frame.children.map((node, i) => renderNode(node, i, ctx))}
    </Svg>
  );
}
