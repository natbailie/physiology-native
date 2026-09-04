/**
 * The app's design tokens, and the light/dark preference behind them.
 *
 * Every screen in `app/` used to carry its own StyleSheet of slate hex literals plus an
 * `isDark && styles.xDark` twin for each one — roughly forty values, hand-typed, approximating
 * the web project's palette from memory. They disagreed with it in places (the web's panel border
 * is not `#e2e8f0`, and its dark surface is not `#1e293b`), which is most of why the two products
 * did not read as siblings.
 *
 * They do not need approximating. `tokens.generated.ts` is a file-synced copy of the web's
 * generated table and already carries every surface, the whole text ramp and the brand chrome
 * resolved to hex for BOTH themes. This module is the seam that spends them: one hook, one
 * palette object, no per-file colour literals.
 *
 * The numeric scales are the web's, converted at the browser's 16px root. Two deliberate
 * departures, both because a phone is not a laptop:
 *
 *   * the two smallest READING sizes are nudged up a point — 13px secondary text is comfortable
 *     at arm's length on a monitor and mean on a handset. `micro` is not nudged: it is the
 *     tracked instrument label, and it is not read as prose.
 *   * `TAP` is new. iOS wants a 44pt minimum touch target and the web has no such constraint,
 *     so there was nothing upstream to copy.
 */
import { useMemo, useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKENS, type ThemeName } from './tokens.generated';

export type { ThemeName };
export type ThemePreference = ThemeName | 'system';

/* ------------------------------------------------------------------ */
/*  The preference                                                     */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'theme';

/**
 * Held in a module-level store rather than a context, for the same reason `useEntitlement` is:
 * the toggle lives on the Account tab and has to re-render the module screen behind it, and
 * threading a provider through two nested navigators to do that buys nothing.
 *
 * `system` is a real third state, not an absent preference — a learner who has not chosen should
 * follow their device, including when the device changes at dusk. This mirrors the web's
 * `useTheme.ts`, which says the same thing about `localStorage`.
 */
let preference: ThemePreference = 'system';
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getPreference = () => preference;

/**
 * Read back at launch. Fire-and-forget on purpose: the first paint uses `system`, which is the
 * right answer for everyone who has never touched the toggle, and the stored choice lands a frame
 * later for the few who have. Blocking the splash on a disk read to avoid that is a bad trade.
 */
void AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored === 'light' || stored === 'dark') {
      preference = stored;
      emit();
    }
  })
  .catch(() => {
    /* No storage. `system` stands, which is a working app rather than a broken one. */
  });

export function setThemePreference(next: ThemePreference) {
  preference = next;
  emit();
  const write = next === 'system' ? AsyncStorage.removeItem(STORAGE_KEY) : AsyncStorage.setItem(STORAGE_KEY, next);
  void write.catch(() => {
    /* The choice still applies for this session. */
  });
}

/* ------------------------------------------------------------------ */
/*  The palette                                                        */
/* ------------------------------------------------------------------ */

/** A token that must exist in the generated table. Missing one is a build-time fact, not a
 *  runtime state, so this throws rather than falling back to a plausible grey that would hide it. */
function token(theme: ThemeName, name: string): string {
  const value = TOKENS[theme][name];
  if (value === undefined) throw new Error(`theme: no ${name} in the ${theme} token table`);
  return value;
}

export interface Palette {
  /** The page ground. */
  bg: string;
  /** A card or panel sitting on it, and the hairline round it. */
  panel: string;
  panelRaised: string;
  panelBorder: string;
  /** The text ramp: prose, secondary, and the tracked instrument labels. */
  text: string;
  textDim: string;
  textFaint: string;
  /** House accent, and the ink it takes on a filled control. */
  brand: string;
  onSolid: string;
  /** The branding surface: a near-black slate panel used on the LIGHT page too, not only in dark
   *  mode. Upstream it is `panel.module.css`'s `.ink`, and the study strip is where it appears. */
  brandInk: string;
  brandInkBorder: string;
  onBrandInk: string;
  brandInkDim: string;
  /** The accent as it reads ON that ink, which is not the same hue as `brand` on the page. */
  brandOnInk: string;
  /** Signals. */
  ok: string;
  warn: string;
  danger: string;
}

function paletteFor(theme: ThemeName): Palette {
  return {
    bg: token(theme, '--bg'),
    panel: token(theme, '--panel'),
    panelRaised: token(theme, '--panel-raised'),
    panelBorder: token(theme, '--panel-border'),
    text: token(theme, '--text'),
    textDim: token(theme, '--text-dim'),
    textFaint: token(theme, '--text-faint'),
    brand: token(theme, '--brand'),
    onSolid: token(theme, '--on-solid'),
    brandInk: token(theme, '--brand-ink'),
    brandInkBorder: token(theme, '--brand-ink-border'),
    onBrandInk: token(theme, '--on-brand-ink'),
    brandInkDim: token(theme, '--brand-ink-dim'),
    brandOnInk: token(theme, '--brand-on-ink'),
    ok: token(theme, '--ok'),
    warn: token(theme, '--warn'),
    danger: token(theme, '--danger'),
  };
}

/** Both resolved once at module load: two objects, shared by every consumer, so a palette lookup
 *  never allocates during a render and `useMemo` deps on it stay stable. */
const PALETTES: Record<ThemeName, Palette> = {
  light: paletteFor('light'),
  dark: paletteFor('dark'),
};

/* ------------------------------------------------------------------ */
/*  The scales                                                         */
/* ------------------------------------------------------------------ */

/** `--s-1` … `--s-8`, at the browser's 16px root. */
export const SPACE = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 24, xxxl: 32, huge: 48 } as const;

/** `--r-sm` … `--r-pill`. */
export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** The web type scale, with the two smallest reading sizes nudged for a handset (see docblock). */
export const FONT = {
  micro: 11,
  xs: 13,
  sm: 14,
  base: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

/** `--lh-tight` / `--lh-snug` / `--lh-prose`, as multipliers. */
export const LINE = { tight: 1.2, snug: 1.4, prose: 1.6 } as const;

/** The iOS minimum touch target. Nothing tappable may be smaller in either dimension. */
export const TAP = 44;

/** `--tracking-tight`, in points at the size it is used on — headings only. */
export const TRACKING_TIGHT = -0.3;

/* ------------------------------------------------------------------ */
/*  The hook                                                           */
/* ------------------------------------------------------------------ */

export interface AppTheme {
  /** What is actually on screen, once the preference and the device have been reconciled. */
  scheme: ThemeName;
  isDark: boolean;
  color: Palette;
  /** What the learner chose, which is `system` until they choose otherwise. */
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
}

/**
 * The resolved theme. Call it in any component that needs a colour; there are no colour literals
 * anywhere else.
 */
export function useAppTheme(): AppTheme {
  const device = useColorScheme();
  const chosen = useSyncExternalStore(subscribe, getPreference, getPreference);
  const scheme: ThemeName = chosen === 'system' ? (device === 'dark' ? 'dark' : 'light') : chosen;

  return useMemo(
    () => ({
      scheme,
      isDark: scheme === 'dark',
      color: PALETTES[scheme],
      preference: chosen,
      setPreference: setThemePreference,
    }),
    [scheme, chosen],
  );
}

/**
 * A module's accent, resolved.
 *
 * The registry states it as a CSS reference — `var(--artery)` — because the web reads it straight
 * off a custom property. Native has no cascade, so the token inside has to be unwrapped and looked
 * up. This was retyped in three screens; it lives here now.
 */
export function accentFrom(accentColorVar: string | undefined, theme: ThemeName, fallback: string): string {
  const name = accentColorVar?.match(/^var\(--([a-z0-9-]+)\)$/)?.[1];
  return (name ? TOKENS[theme][`--${name}`] : undefined) ?? fallback;
}

/**
 * The card's corner wash, flattened.
 *
 * The web bleeds the accent in from the top-right with a `radial-gradient` and `color-mix`.
 * React Native has neither without pulling in a gradient library, so the same idea is expressed
 * as a low-opacity accent block clipped to the card's corner — see `cards/cardStyles.ts`. What is
 * needed here is only the alpha, which the web sets at 19% of the accent held at 0.7 opacity.
 */
export const ACCENT_WASH_OPACITY = 0.13;

/** Convenience for the handful of places that want a translucent accent (the `due` pill's bed,
 *  a pressed state) and would otherwise reach for a hardcoded rgba. */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const n = parseInt(match[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
