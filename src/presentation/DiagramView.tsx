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

/* ------------------------------------------------------------------ */
/*  Colour token resolution                                            */
/* ------------------------------------------------------------------ */

/**
 * In the web renderer, `colorToken` becomes `var(--token)` resolved by CSS.
 * On native, each module provides its own palette; tokens map to hex strings.
 * This is a starter palette — modules will provide their own eventually.
 */
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
  baseline: '#94a3b8',
  trail: '#334155',
  normal: '#22c55e',
  live: '#f97316',
  'isopleth-20': '#94a3b8',
  'isopleth-30': '#94a3b8',
  'isopleth-40': '#94a3b8',
  'isopleth-60': '#94a3b8',
  'isopleth-80': '#94a3b8',
  'isopleth-100': '#94a3b8',
};

function resolveColor(token?: string): string {
  if (!token) return '#000000';
  return TOKEN_PALETTE[token] ?? '#000000';
}

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
  plotGrid: { stroke: '#e2e8f0', strokeWidth: 0.75, opacity: 0.8 },
  plotAxis: { stroke: '#94a3b8', strokeWidth: 1.2 },
  axisLabel: { fill: '#94a3b8', fontSize: 9 },
  isopleth: { stroke: '#cbd5e1', strokeWidth: 1, opacity: 0.9 },
  isoplethLabel: { fill: '#94a3b8', fontSize: 9 },
  bufferLine: { stroke: '#64748b', strokeWidth: 1.6 },
  normalPoint: { fill: '#22c55e' },
  livePoint: { fill: '#f97316' },
  trail: { stroke: '#475569', strokeWidth: 1.8, fill: 'none' },
  baselineTrail: { stroke: '#94a3b8', strokeWidth: 1.4, fill: 'none', dash: '4,3', opacity: 0.6 },
  regionLabel: { fill: '#94a3b8', fontSize: 9, fontStyle: 'italic' },
  verdict: { fill: '#0f172a', fontSize: 13, fontWeight: '700' },
  verdictMixed: { fill: '#dc2626', fontSize: 13, fontWeight: '700' },
  pathLabel: { fill: '#64748b', fontSize: 11 },
  organLabel: { fill: '#64748b', fontSize: 11 },
  label: { fill: '#475569', fontSize: 11 },
  caption: { fill: '#94a3b8', fontSize: 10 },
  alarm: { fill: '#dc2626', fontSize: 12, fontWeight: '700' },
  valueLabel: { fill: '#0f172a', fontSize: 12, fontWeight: '700' },
};

function clsStyle(cls: string | undefined): ClsStyle {
  if (!cls) return {};
  return CLS_STYLES[cls] ?? {};
}

/* ------------------------------------------------------------------ */
/*  SVG attribute parsing                                              */
/* ------------------------------------------------------------------ */

function parseTransform(transform?: string): Record<string, string> | undefined {
  if (!transform) return undefined;
  // Handle translate(x, y)
  const translate = transform.match(/translate\(([-\d.]+),?\s*([-\d.]+)\)/);
  if (translate) {
    return { translateX: translate[1], translateY: translate[2] };
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  Scene node renderer                                                */
/* ------------------------------------------------------------------ */

function renderNode(node: SceneNode, index: number): React.ReactNode {
  switch (node.type) {
    case 'group': {
      const transform = parseTransform(node.transform);
      return (
        <G key={index} transform={transform ? `${transform.translateX}, ${transform.translateY}` : undefined}>
          {node.children.map((child, i) => renderNode(child, i))}
        </G>
      );
    }

    case 'path':
      return (
        <Path
          key={index}
          d={node.d}
          stroke={clsStyle(node.cls).stroke ?? resolveColor(node.colorToken)}
          fill={node.fill === 'none' ? 'none' : clsStyle(node.cls).fill ?? (node.colorToken ? resolveColor(node.colorToken) : '#000000')}
          strokeWidth={clsStyle(node.cls).strokeWidth ?? node.strokeWidth ?? (clsStyle(node.cls).stroke ? 1 : 1)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={clsStyle(node.cls).dash}
          opacity={clsStyle(node.cls).opacity}
        />
      );

    case 'circle':
      return (
        <Circle
          key={index}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill={clsStyle(node.cls).fill ?? resolveColor(node.fill)}
          opacity={clsStyle(node.cls).opacity}
        />
      );

    case 'rect':
      return (
        <Rect
          key={index}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          fill={resolveColor(node.fill)}
        />
      );

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

    case 'text':
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
          opacity={node.opacity}
        >
          {node.text}
        </SvgText>
      );

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
}

export function DiagramView({ frame }: DiagramViewProps) {
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
      {frame.children.map((node, i) => renderNode(node, i))}
    </Svg>
  );
}
