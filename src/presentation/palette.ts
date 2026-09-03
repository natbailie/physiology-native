/**
 * The diagram colour palette.
 *
 * On the web each `colorToken` becomes `var(--token)`, resolved from the token block in
 * `index.css`. Native has no cascade, so the tokens resolve to hex through
 * `tokens.generated.ts` — a file-synced copy of the web project's generated table, which
 * carries every token resolved for BOTH themes. Its own docblock says why it exists: "one
 * resolved value per theme in a file both platforms can import".
 *
 * This used to be a hand-written map of the web's LIGHT values only, so dark mode drew the
 * diagram in light-mode ink: near-black labels on the dark navy background, effectively
 * invisible. All 98 tokens the module presentations emit are present in the generated table for
 * both themes, so nothing is approximated here any more.
 */
import { TOKENS, type ThemeName } from './tokens.generated';

export type { ThemeName };

/** Colours with no web token: the generic organ body, the liver's glycogen level (the web washes
 * `--glucose` towards transparent; native draws it at low opacity), and the muted grey a
 * secondary trace falls back to, which tracks `--text-faint` in each theme. */
const NATIVE_ONLY: Record<ThemeName, Record<string, string>> = {
  light: { organ: '#f1f5f9', glycogenFill: '#8a6c00', baseline: '#64748b' },
  dark: { organ: '#1e293b', glycogenFill: '#d4b45a', baseline: '#94a3b8' },
};

/** A token to its hex for the given theme, or `undefined` when there is none. For callers that
 * would rather draw nothing than draw a wrong colour — a readout tile simply goes without its
 * accent rule. */
export function lookupColor(token?: string, theme: ThemeName = 'light'): string | undefined {
  if (!token) return undefined;
  return TOKENS[theme][`--${token}`] ?? NATIVE_ONLY[theme][token];
}

/** A token to its hex. An unknown token is black — deliberately loud, so a missing entry shows
 * up the first time the diagram is looked at rather than passing as a plausible grey. Callers
 * must not hand this an absent FILL, which is `none` rather than a colour (see `pathFill`). */
export function resolveColor(token?: string, theme: ThemeName = 'light'): string {
  return lookupColor(token, theme) ?? '#000000';
}
