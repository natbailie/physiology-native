import React from 'react';
import { Circle, ClipPath, Defs, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { OrganName } from './types';
import { useAppTheme } from './theme';
import { resolveColor, type ThemeName } from './palette';
// Byte-identical to what glucoseRegulation's presentation imports, so they come from the one
// file-synced source rather than a second copy that can drift.
import { LIVER_PATH, PANCREAS_PATH } from './organShapes';

/** The active theme, for the organ palettes below. Each organ resolves its own colours rather
 *  than taking them as props, so each reads the scheme for itself. */
function useThemeName(): ThemeName {
  return useAppTheme().scheme;
}

/* ------------------------------------------------------------------ */
/*  Organ shape paths (from the web project's shared organShapes.ts)   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Wash levels                                                        */
/* ------------------------------------------------------------------ */

/** The web fills an organ body with a wash — its signal colour mixed towards transparent — and
 * strokes the outline in that colour at full strength. These are the web's `--wash-*` steps, and
 * they are applied as `fillOpacity` so the outline stays solid; a plain `opacity` would fade the
 * stroke with the fill and lose the shape's edge. */
const WASH_FAINT = 0.14;
const WASH_STRONG = 0.48;

/**
 * The web's shared diagram-text classes: `organLabel` names a structure in `--text`, and the
 * smaller in-diagram detail labels sit in `--text-dim`.
 *
 * These were two hardcoded LIGHT hex values, which is what the docblock above already said they
 * should not be. Every organ name — "Heart", "Kidneys", "Liver" — was therefore drawn in
 * near-black on the dark theme's navy ground and was effectively unreadable, the same bug
 * `palette.ts` records having fixed for the diagram's other ink.
 */
const organName = (theme: ThemeName) => resolveColor('text', theme);
const organDetail = (theme: ThemeName) => resolveColor('text-dim', theme);

/* ------------------------------------------------------------------ */
/*  Organ components                                                    */
/* ------------------------------------------------------------------ */

interface OrganProps {
  x: number;
  y: number;
  params: Readonly<Record<string, number>>;
}

function pancreasShape(): string {
  return PANCREAS_PATH;
}

function Pancreas({ x, y, params }: OrganProps) {
  const theme = useThemeName();
  const insulinLevel = Math.min(params.insulinLevel ?? 0, 1);
  const glucagonLevel = params.glucagonLevel ?? 0;
  // Beta islet fills as insulin output rises; alpha as glucagon does.
  const betaR = 4 + insulinLevel * 4;
  const alphaR = 4 + glucagonLevel * 3;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Path d={pancreasShape()} fill={resolveColor('insulin', theme)} fillOpacity={WASH_FAINT} stroke={resolveColor('insulin', theme)} strokeWidth={2} />
      <Circle cx={-12} cy={-3} r={betaR} fill={resolveColor('insulin', theme)} />
      <Circle cx={12} cy={-1} r={alphaR} fill={resolveColor('glucagon', theme)} />
      <SvgText x={-18} y={-12} fontSize={9} textAnchor="middle" fill={organDetail(theme)}>β</SvgText>
      <SvgText x={18} y={-10} fontSize={9} textAnchor="middle" fill={organDetail(theme)}>α</SvgText>
      <SvgText x={0} y={26} fontSize={11} fontWeight="600" textAnchor="middle" fill={organName(theme)}>Pancreas</SvgText>
    </G>
  );
}

const LIVER_TOP = -26;
const LIVER_BOTTOM = 26;
const LIVER_HEIGHT = LIVER_BOTTOM - LIVER_TOP;

function Liver({ x, y, params }: OrganProps) {
  const theme = useThemeName();
  const glycogenReserve = params.glycogenReserve ?? 0;
  const hepaticOutput = params.hepaticOutput ?? 0;
  const fillHeight = LIVER_HEIGHT * glycogenReserve;
  const clipId = `liver-glycogen-${Math.round(x)}-${Math.round(y)}`;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={LIVER_PATH} />
        </ClipPath>
      </Defs>
      <Path d={LIVER_PATH} fill={resolveColor('glucagon', theme)} fillOpacity={WASH_FAINT} stroke={resolveColor('glucagon', theme)} strokeWidth={2} />
      <Rect
        x={-42}
        y={LIVER_BOTTOM - fillHeight}
        width={84}
        height={fillHeight}
        fill={resolveColor('glycogenFill', theme)}
        clipPath={`url(#${clipId})`}
        fillOpacity={glycogenReserve > 0 ? WASH_STRONG + hepaticOutput * 0.12 : 0}
      />
      <SvgText x={0} y={44} fontSize={11} fontWeight="600" textAnchor="middle" fill={organName(theme)}>Liver</SvgText>
    </G>
  );
}

/** The organs not yet drawn in native detail render as a labelled rounded square — honest,
 * and they still move with the scene. Replaced one by one as their modules are ported. */
function Placeholder({ x, y, name }: OrganProps & { name: string }) {
  const theme = useThemeName();
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Circle cx={0} cy={0} r={24} fill={resolveColor('baseline', theme)} opacity={0.3} />
      <SvgText x={0} y={4} fontSize={11} textAnchor="middle" fill={organName(theme)}>{name}</SvgText>
    </G>
  );
}

export function renderOrgan(name: OrganName, x: number, y: number, params: Readonly<Record<string, number>>, index: number): React.ReactNode {
  switch (name) {
    case 'pancreas':
      return <Pancreas key={index} x={x} y={y} params={params} />;
    case 'liver':
      return <Liver key={index} x={x} y={y} params={params} />;
    default:
      return <Placeholder key={index} x={x} y={y} params={params} name={name} />;
  }
}
