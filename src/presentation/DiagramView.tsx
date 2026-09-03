import React from 'react';
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
import { resolveColor } from './palette';

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

const CLS_STYLES: Record<string, ClsStyle> = {
  plotGrid: { stroke: '#e2e8f0', strokeWidth: 1 },
  plotAxis: { stroke: '#64748b', strokeWidth: 1.2 },
  axisLabel: { fill: '#64748b', fontSize: 8 },
  isopleth: { stroke: '#b4500c', strokeWidth: 1, dash: '3,4', opacity: 0.5 },
  isoplethLabel: { fill: '#b4500c', fontSize: 7, opacity: 0.85 },
  bufferLine: { stroke: '#177d36', strokeWidth: 1.6, opacity: 0.75 },
  // The normal-status marker is a hollow dashed ring, not a disc — it marks where a healthy
  // person sits so the live point can be read against it, and a filled marker would compete
  // with the live point for the eye.
  normalPoint: { fill: 'none', stroke: '#64748b', strokeWidth: 1.2, dash: '2,2' },
  livePoint: { fill: '#c2258c', stroke: '#ffffff', strokeWidth: 1.5 },
  trail: { stroke: '#c2258c', strokeWidth: 1.6, fill: 'none', opacity: 0.45 },
  baselineTrail: { stroke: '#64748b', strokeWidth: 1.4, fill: 'none', dash: '3,3', opacity: 0.55 },
  regionLabel: { fill: '#64748b', fontSize: 7, opacity: 0.85 },
  verdict: { fill: '#0f172a', fontSize: 9, fontWeight: '600' },
  verdictMixed: { fill: '#c62828', fontSize: 9, fontWeight: '600' },
  pathLabel: { fill: '#475569', fontSize: 9 },
  organLabel: { fill: '#0f172a', fontSize: 11, fontWeight: '600' },
  label: { fill: '#475569', fontSize: 11 },
  caption: { fill: '#64748b', fontSize: 11 },
  alarm: { fill: '#c62828', fontSize: 12 },
  valueLabel: { fill: '#0f172a', fontSize: 9 },
};

function clsStyle(cls: string | undefined): ClsStyle {
  if (!cls) return {};
  return CLS_STYLES[cls] ?? {};
}

/**
 * A path's fill. The schema's paths are overwhelmingly stroke-only — isopleths, trails, buffer
 * lines — and the web gets `fill: none` for them from the CSS module. Native has no such sheet, so
 * an unfilled path must default to `'none'` here; falling back to a colour would paint an isopleth
 * curve as a solid black wedge over the plot. A fill is only ever drawn when the node or its class
 * explicitly asks for one. (`colorToken` is the stroke colour, as on the web, never the fill.)
 */
/**
 * An absent fill is `none`, never a colour.
 *
 * `resolveColor` answers `#000000` for a token it does not know, which is a reasonable last
 * resort for a stroke and a disaster for a fill: 38 of the 97 rect nodes across the module
 * presentations carry no `fill` of their own, and every one of them drew as a solid black block
 * — shockStates rendered both heart chambers as filled squares over the circuit behind them.
 * Paths already went through here; circles and rects now do too.
 */
function pathFill(fill: string | undefined, style: ClsStyle): string {
  if (fill === 'none') return 'none';
  if (fill) return resolveColor(fill);
  return style.fill ?? 'none';
}

/* ------------------------------------------------------------------ */
/*  Scene node renderer                                                */
/* ------------------------------------------------------------------ */

function renderNode(node: SceneNode, index: number, blinded: boolean): React.ReactNode {
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
          {node.children.map((child, i) => renderNode(child, i, blinded))}
        </G>
      );
    }

    case 'path': {
      const ps = clsStyle(node.cls);
      return (
        <Path
          key={index}
          d={node.d}
          stroke={ps.stroke ?? resolveColor(node.colorToken)}
          fill={pathFill(node.fill, ps)}
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
      const cs = clsStyle(node.cls);
      return (
        <Circle
          key={index}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill={pathFill(node.fill, cs)}
          stroke={cs.stroke}
          strokeWidth={cs.strokeWidth}
          strokeDasharray={cs.dash}
          opacity={cs.opacity}
        />
      );
    }

    case 'rect': {
      const rs = clsStyle(node.cls);
      return (
        <Rect
          key={index}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          fill={pathFill(node.fill, rs)}
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
          stroke={clsStyle(node.cls).stroke ?? resolveColor(node.colorToken)}
          strokeWidth={clsStyle(node.cls).strokeWidth ?? 1}
          strokeDasharray={clsStyle(node.cls).dash}
          opacity={clsStyle(node.cls).opacity}
        />
      );

    case 'text': {
      /**
       * A `verdict` names the pattern the model has settled into, so it goes while a
       * pattern-discrimination question is unanswered — the web hides the same class through
       * `[data-blinded='true'] .verdict`. Only the verdict: the `label` line beside it lists the
       * findings, and reading the findings is the exercise rather than a way around it.
       */
      if (blinded && node.cls === 'verdict') return null;
      const ts = clsStyle(node.cls);
      return (
        <SvgText
          key={index}
          x={node.x}
          y={node.y}
          fill={ts.fill ?? resolveColor(node.colorToken)}
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
          stroke={resolveColor(node.colorToken)}
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
            stroke={resolveColor(node.colorToken)}
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
            fill={resolveColor(node.colorToken)}
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
                  <Path d="M0,0 L8,4 L0,8 Z" fill={resolveColor(def.colorToken)} />
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
      {frame.children.map((node, i) => renderNode(node, i, blinded))}
    </Svg>
  );
}
