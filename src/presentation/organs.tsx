import React from 'react';
import { Circle, ClipPath, Defs, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { OrganName } from './types';
import { useColorScheme } from 'react-native';
import { resolveColor, type ThemeName } from './palette';

/** The active theme, for the organ palettes below. Each organ resolves its own colours rather
 *  than taking them as props, so each reads the scheme for itself. */
function useThemeName(): ThemeName {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/* ------------------------------------------------------------------ */
/*  Organ shape paths (from the web project's shared organShapes.ts)   */
/* ------------------------------------------------------------------ */

export const PANCREAS_PATH = 'M-32,-6 C-30,-14 -18,-16 -6,-14 C10,-12 26,-8 34,0 C30,8 14,10 -2,8 C-16,6 -28,4 -32,-6 Z';
export const LIVER_PATH = 'M-38,-16 C-16,-26 20,-26 38,-14 C42,4 30,22 6,26 C-14,29 -34,20 -40,2 C-41,-5 -40,-12 -38,-16 Z';
export const KIDNEY_PATH =
  'M-8,-32 C10,-36 24,-22 22,-4 C21,6 10,4 6,13 C2,21 10,26 18,24 C26,34 14,44 -2,42 C-20,39 -26,18 -22,-2 C-19,-20 -18,-28 -8,-32 Z';
export const HEART_PATH = 'M0,-12 C-16,-28 -40,-12 -40,8 C-40,28 -16,36 0,48 C16,36 40,28 40,8 C40,-12 16,-28 0,-12 Z';
export const LUNG_PATH =
  'M0,-38 C18,-40 30,-14 28,14 C26,38 14,50 0,50 C-2,50 -4,49 -6,48 C-16,42 -24,26 -24,4 C-24,-20 -14,-38 0,-38 Z';

/* ------------------------------------------------------------------ */
/*  Wash levels                                                        */
/* ------------------------------------------------------------------ */

/** The web fills an organ body with a wash — its signal colour mixed towards transparent — and
 * strokes the outline in that colour at full strength. These are the web's `--wash-*` steps, and
 * they are applied as `fillOpacity` so the outline stays solid; a plain `opacity` would fade the
 * stroke with the fill and lose the shape's edge. */
const WASH_FAINT = 0.14;
const WASH_SOFT = 0.22;
const WASH = 0.32;
const WASH_STRONG = 0.48;

/** The web's shared diagram-text classes: `organLabel` names a structure in `--text`, and the
 * smaller in-diagram detail labels sit in `--text-dim`. */
const ORGAN_NAME = '#0f172a';
const ORGAN_DETAIL = '#475569';

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
      <SvgText x={-18} y={-12} fontSize={9} textAnchor="middle" fill={ORGAN_DETAIL}>β</SvgText>
      <SvgText x={18} y={-10} fontSize={9} textAnchor="middle" fill={ORGAN_DETAIL}>α</SvgText>
      <SvgText x={0} y={26} fontSize={11} fontWeight="600" textAnchor="middle" fill={ORGAN_NAME}>Pancreas</SvgText>
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
      <SvgText x={0} y={44} fontSize={11} fontWeight="600" textAnchor="middle" fill={ORGAN_NAME}>Liver</SvgText>
    </G>
  );
}

function Heart({ x, y, params }: OrganProps) {
  const theme = useThemeName();
  const heartRate = params.heartRate ?? 70;
  const svScale = params.strokeVolumeScale ?? 1;
  const beatScale = 1 + Math.min(Math.max(heartRate - 70, 0), 110) / 140 * 0.04;
  const heartScale = (svScale * beatScale).toFixed(3);
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Path
        d={HEART_PATH}
        fill={resolveColor('artery', theme)}
        fillOpacity={WASH_SOFT}
        stroke={resolveColor('artery', theme)}
        strokeWidth={2.5}
        transform={`scale(${heartScale})`}
      />
      <SvgText x={-34} y={68} fontSize={11} fontWeight="600" textAnchor="middle" fill={ORGAN_NAME}>Heart</SvgText>
    </G>
  );
}

function Kidneys({ x, y, params }: OrganProps) {
  const theme = useThemeName();
  const gfrIntensity = params.gfrIntensity ?? 1;
  const urineSpeed = params.urineSpeed ?? 0.5;
  const urineOpacity = Math.min(Math.max(urineSpeed, 0), 2) * 0.4;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <G transform="translate(0, -22)">
        <Path d={KIDNEY_PATH} fill={resolveColor('kidney', theme)} fillOpacity={gfrIntensity * WASH} stroke={resolveColor('kidney', theme)} strokeWidth={2} />
      </G>
      <G transform="translate(0, 24) scale(-1, 1)">
        <Path d={KIDNEY_PATH} fill={resolveColor('kidney', theme)} fillOpacity={gfrIntensity * WASH} stroke={resolveColor('kidney', theme)} strokeWidth={2} />
      </G>
      <Path d="M0,68 L0,96" stroke={resolveColor('urine', theme)} strokeWidth={2.5} strokeDasharray="2,6" strokeLinecap="round" opacity={urineOpacity} />
      <SvgText x={14} y={90} fontSize={9} fill={ORGAN_DETAIL}>urine</SvgText>
      <SvgText x={-20} y={112} fontSize={11} fontWeight="600" textAnchor="middle" fill={ORGAN_NAME}>Kidneys</SvgText>
    </G>
  );
}

const ALVEOLAR_UNITS = [
  { x: -6, y: -22 },
  { x: 6, y: -6 },
  { x: -8, y: 6 },
  { x: 4, y: 20 },
  { x: -4, y: 34 },
];

function Lungs({ x, y, params }: OrganProps) {
  const theme = useThemeName();
  const breathRate = params.breathRate ?? 14;
  const ventDepth = params.ventDepth ?? 1;
  const deadUnits = Math.round((params.vqMismatch ?? 0) * ALVEOLAR_UNITS.length);
  // Rate and depth compose, as they do on the web: the breath-rate term stands in for the
  // `breathe` keyframe animation, and vent depth scales the lungs about their own centre.
  const breathScale = 1 + Math.min(Math.max(breathRate - 14, 0), 46) / 46 * 0.03;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Path d="M0,-56 L0,-8" stroke={resolveColor('text', theme)} strokeWidth={2} />
      <G transform={`scale(${(breathScale * ventDepth).toFixed(3)})`}>
        <Path d={LUNG_PATH} fill={resolveColor('o2')} fillOpacity={WASH_SOFT} stroke={resolveColor('o2')} strokeWidth={2.5} transform="translate(-20, 0)" />
        <Path d={LUNG_PATH} fill={resolveColor('o2')} fillOpacity={WASH_SOFT} stroke={resolveColor('o2')} strokeWidth={2.5} transform="translate(20, 0) scale(-1, 1)" />
        {[-20, 20].map((side) =>
          ALVEOLAR_UNITS.map((unit, index) => (
            <Circle
              key={`${side}-${index}`}
              cx={side + unit.x * (side < 0 ? 1 : -1)}
              cy={unit.y}
              r={4}
              fill={index < deadUnits ? 'none' : resolveColor('o2')}
              fillOpacity={index < deadUnits ? undefined : 0.55}
              stroke={index < deadUnits ? resolveColor('co2') : undefined}
              strokeWidth={index < deadUnits ? 1.6 : undefined}
              strokeDasharray={index < deadUnits ? '2,2' : undefined}
            />
          )),
        )}
      </G>
      <SvgText x={0} y={66} fontSize={11} fontWeight="600" textAnchor="middle" fill={ORGAN_NAME}>Lungs</SvgText>
    </G>
  );
}

function RenalCompensation({ x, y, params }: OrganProps) {
  const theme = useThemeName();
  const hco3Intensity = params.hco3Intensity ?? 0.5;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <G transform="translate(0, -22)">
        <Path d={KIDNEY_PATH} fill={resolveColor('bicarb', theme)} fillOpacity={hco3Intensity * WASH} stroke={resolveColor('bicarb', theme)} strokeWidth={2} />
      </G>
      <G transform="translate(0, 24) scale(-1, 1)">
        <Path d={KIDNEY_PATH} fill={resolveColor('bicarb', theme)} fillOpacity={hco3Intensity * WASH} stroke={resolveColor('bicarb', theme)} strokeWidth={2} />
      </G>
      <SvgText x={-20} y={54} fontSize={11} fontWeight="600" textAnchor="middle" fill={ORGAN_NAME}>Kidneys</SvgText>
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
      <SvgText x={0} y={4} fontSize={11} textAnchor="middle" fill={ORGAN_NAME}>{name}</SvgText>
    </G>
  );
}

export function renderOrgan(name: OrganName, x: number, y: number, params: Readonly<Record<string, number>>, index: number): React.ReactNode {
  switch (name) {
    case 'pancreas':
      return <Pancreas key={index} x={x} y={y} params={params} />;
    case 'liver':
      return <Liver key={index} x={x} y={y} params={params} />;
    case 'heart':
      return <Heart key={index} x={x} y={y} params={params} />;
    case 'kidneys':
      return <Kidneys key={index} x={x} y={y} params={params} />;
    case 'lungs':
      return <Lungs key={index} x={x} y={y} params={params} />;
    case 'renalCompensation':
      return <RenalCompensation key={index} x={x} y={y} params={params} />;
    default:
      return <Placeholder key={index} x={x} y={y} params={params} name={name} />;
  }
}
