import type { ThemeName } from './palette';

/**
 * A module's diagram classes, ported from its own `Diagram.module.css`.
 *
 * Per module, not global, because the web scopes these with CSS modules and the same name means
 * different things in different ones: `.chamber` is a 2px stroke in ecgConduction and 2.5px in
 * shockStates, and `.canal` is the cochlear duct in hearing but a semicircular canal in
 * vestibular, in different colours and weights. A single shared table cannot express that. The
 * eleven names from the shared `diagramText` sheet stay global, exactly as they are upstream.
 */

/** The wash percentages from index.css, which differ per theme. */
const WASH = {
  light: { faint: 0.14, soft: 0.22, base: 0.32, strong: 0.48 },
  dark: { faint: 0.18, soft: 0.26, base: 0.36, strong: 0.52 },
} as const;

export type WashName = keyof (typeof WASH)['light'];

/**
 * A value that may be driven by one of the node's `styleVars` — the CSS custom properties a
 * module's engine writes onto an element, which is how a diagram shows a quantity rather than
 * stating it.
 *
 *   number                      a constant
 *   { wash }                    a theme-dependent wash percentage
 *   { var, base, scale }        calc(base + var(--x) * scale)
 *   { var, scaleWash }          calc(var(--x) * var(--wash-y))
 */
export type ClsValue =
  | number
  | { wash: WashName }
  | { var: string; base?: number; scale: number }
  | { var: string; scaleWash: WashName };

export interface ClsSpec {
  /** Colour token for the stroke. */
  stroke?: string;
  /** Colour token for the fill, or 'none'. */
  fill?: string;
  /**
   * Opacity applied to the fill alone.
   *
   * The web writes these as `color-mix(in srgb, var(--token) P%, transparent)`. Where it mixes
   * towards `var(--panel)` rather than transparent the result is approximated by the same
   * opacity over the panel, which is what sits behind the diagram anyway.
   */
  fillOpacity?: ClsValue;
  strokeWidth?: ClsValue;
  opacity?: ClsValue;
  dash?: string;
  linecap?: 'butt' | 'round' | 'square';
  fontSize?: number;
  fontWeight?: string;
  anchor?: 'start' | 'middle' | 'end';
}

export type DiagramClasses = Readonly<Record<string, ClsSpec>>;

/** Resolves a `ClsValue` against the active theme and the node's own styleVars. */
export function resolveClsValue(
  value: ClsValue | undefined,
  theme: ThemeName,
  styleVars: Readonly<Record<string, number | string>> | undefined,
): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if ('wash' in value) return WASH[theme][value.wash];

  const raw = styleVars?.[value.var];
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseFloat(raw) : NaN;
  const driver = Number.isFinite(n) ? n : 0;

  if ('scaleWash' in value) return driver * WASH[theme][value.scaleWash];
  return (value.base ?? 0) + driver * value.scale;
}
