import React from 'react';
import { Circle, ClipPath, Defs, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { OrganName } from './types';

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
/*  Colour resolution (shared palette)                                  */
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
  baseline: '#94a3b8',
  organ: '#f1f5f9',
  organStroke: '#94a3b8',
  glycogenFill: '#22c55e',
};

function fill(token: string | undefined, def: string): string {
  if (!token) return def;
  return TOKEN_PALETTE[token] ?? def;
}

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
  const insulinLevel = Math.min(params.insulinLevel ?? 0, 1);
  const glucagonLevel = params.glucagonLevel ?? 0;
  // Beta islet fills as insulin output rises; alpha as glucagon does.
  const betaR = 4 + insulinLevel * 4;
  const alphaR = 4 + glucagonLevel * 3;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Path d={pancreasShape()} fill={fill('organ', '#f1f5f9')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} />
      <Circle cx={-12} cy={-3} r={betaR} fill={fill('insulin', '#eab308')} />
      <Circle cx={12} cy={-1} r={alphaR} fill={fill('glucagon', '#f97316')} />
      <SvgText x={-18} y={-12} fontSize={10} textAnchor="middle" fill={fill('text', '#64748b')}>β</SvgText>
      <SvgText x={18} y={-10} fontSize={10} textAnchor="middle" fill={fill('text', '#64748b')}>α</SvgText>
      <SvgText x={0} y={26} fontSize={12} textAnchor="middle" fill={fill('text', '#64748b')}>Pancreas</SvgText>
    </G>
  );
}

const LIVER_TOP = -26;
const LIVER_BOTTOM = 26;
const LIVER_HEIGHT = LIVER_BOTTOM - LIVER_TOP;

function Liver({ x, y, params }: OrganProps) {
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
      <Path d={LIVER_PATH} fill={fill('organ', '#f1f5f9')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} />
      <Rect
        x={-42}
        y={LIVER_BOTTOM - fillHeight}
        width={84}
        height={fillHeight}
        fill={fill('glycogenFill', '#22c55e')}
        clipPath={`url(#${clipId})`}
        opacity={glycogenReserve > 0 ? 0.75 + hepaticOutput * 0.2 : 0}
      />
      <SvgText x={0} y={44} fontSize={12} textAnchor="middle" fill={fill('text', '#64748b')}>Liver</SvgText>
    </G>
  );
}

function Heart({ x, y, params }: OrganProps) {
  const heartRate = params.heartRate ?? 70;
  const svScale = params.strokeVolumeScale ?? 1;
  const beatScale = 1 + Math.min(Math.max(heartRate - 70, 0), 110) / 140 * 0.04;
  const heartScale = (svScale * beatScale).toFixed(3);
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Path
        d={HEART_PATH}
        fill={fill('artery', '#dc2626')}
        stroke={fill('organStroke', '#94a3b8')}
        strokeWidth={1.2}
        transform={`scale(${heartScale})`}
        opacity={0.9}
      />
      <SvgText x={-34} y={68} fontSize={12} textAnchor="middle" fill={fill('text', '#64748b')}>Heart</SvgText>
    </G>
  );
}

function Kidneys({ x, y, params }: OrganProps) {
  const gfrIntensity = params.gfrIntensity ?? 1;
  const urineSpeed = params.urineSpeed ?? 0.5;
  const urineOpacity = Math.min(Math.max(urineSpeed, 0), 2) * 0.4;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <G transform="translate(0, -22)">
        <Path d={KIDNEY_PATH} fill={fill('kidney', '#8b5cf6')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} opacity={0.5 + gfrIntensity * 0.4} />
      </G>
      <G transform="translate(0, 24) scale(-1, 1)">
        <Path d={KIDNEY_PATH} fill={fill('kidney', '#8b5cf6')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} opacity={0.5 + gfrIntensity * 0.4} />
      </G>
      <Path d="M0,68 L0,96" stroke={fill('kidney', '#8b5cf6')} strokeWidth={2} opacity={urineOpacity} />
      <SvgText x={14} y={90} fontSize={10} fill={fill('text', '#64748b')}>urine</SvgText>
      <SvgText x={-20} y={112} fontSize={12} textAnchor="middle" fill={fill('text', '#64748b')}>Kidneys</SvgText>
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
  const breathRate = params.breathRate ?? 14;
  const ventDepth = params.ventDepth ?? 1;
  const deadUnits = Math.round((params.vqMismatch ?? 0) * ALVEOLAR_UNITS.length);
  const breathScale = 1 + Math.min(Math.max(breathRate - 14, 0), 46) / 46 * 0.03;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Path d="M0,-56 L0,-8" stroke={fill('organStroke', '#94a3b8')} strokeWidth={3} />
      <G transform={`scale(${breathScale.toFixed(3)})`}>
        <Path d={LUNG_PATH} fill={fill('o2', '#3b82f6')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} transform="translate(-20, 0)" opacity={0.25 + ventDepth * 0.5} />
        <Path d={LUNG_PATH} fill={fill('o2', '#3b82f6')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} transform="translate(20, 0) scale(-1, 1)" opacity={0.25 + ventDepth * 0.5} />
        {[-20, 20].map((side) =>
          ALVEOLAR_UNITS.map((unit, index) => (
            <Circle
              key={`${side}-${index}`}
              cx={side + unit.x * (side < 0 ? 1 : -1)}
              cy={unit.y}
              r={4}
              fill={index < deadUnits ? fill('co2', '#64748b') : fill('o2', '#3b82f6')}
            />
          )),
        )}
      </G>
      <SvgText x={0} y={66} fontSize={12} textAnchor="middle" fill={fill('text', '#64748b')}>Lungs</SvgText>
    </G>
  );
}

function RenalCompensation({ x, y, params }: OrganProps) {
  const hco3Intensity = params.hco3Intensity ?? 0.5;
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <G transform="translate(0, -22)">
        <Path d={KIDNEY_PATH} fill={fill('bicarbonate', '#06b6d4')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} opacity={0.3 + hco3Intensity * 0.4} />
      </G>
      <G transform="translate(0, 24) scale(-1, 1)">
        <Path d={KIDNEY_PATH} fill={fill('bicarbonate', '#06b6d4')} stroke={fill('organStroke', '#94a3b8')} strokeWidth={1.2} opacity={0.3 + hco3Intensity * 0.4} />
      </G>
      <SvgText x={-20} y={54} fontSize={12} textAnchor="middle" fill={fill('text', '#64748b')}>Kidneys</SvgText>
    </G>
  );
}

/** The organs not yet drawn in native detail render as a labelled rounded square — honest,
 * and they still move with the scene. Replaced one by one as their modules are ported. */
function Placeholder({ x, y, name }: OrganProps & { name: string }) {
  return (
    <G transform={"translate(" + x + ", " + y + ")"}>
      <Circle cx={0} cy={0} r={24} fill={fill('baseline', '#94a3b8')} opacity={0.3} />
      <SvgText x={0} y={4} fontSize={11} textAnchor="middle" fill="#000">{name}</SvgText>
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
