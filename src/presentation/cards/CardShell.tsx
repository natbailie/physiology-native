/**
 * The grid tile chrome, shared by the three card kinds.
 *
 * A direct port of the web's `shared/styles/card.module.css`, which exists upstream for exactly
 * the reason it exists here: the panel, the corner wash and the name row were byte-identical
 * across ModuleCard and ThemeCard, and only the body copy and the badges genuinely differ.
 *
 * The corner wash is the one thing that needs re-expressing rather than translating. The web
 * bleeds the accent in from the top-right with `radial-gradient(9rem 9rem at 100% 0%, ...)`, and
 * its stylesheet is explicit about why it is a gradient and not a shape: "a hard-edged shape
 * behind a line of text is a legibility problem dressed as decoration" — the card's top-right
 * corner is where the count sits. React Native has no gradient background, but `react-native-svg`
 * is already a dependency for the diagrams, so the gradient is drawn rather than approximated
 * with a low-opacity disc, which would reintroduce the very edge that comment is about.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import { ACCENT_WASH_OPACITY, RADIUS, SPACE, useAppTheme } from '../theme';

interface CardShellProps {
  /** The module/theme/subject accent, already resolved to hex. Absent falls back to the hairline,
   *  which is what `var(--card-accent, var(--panel-border))` does upstream. */
  accent?: string;
  /** Absent makes the tile inert — the coming-soon state. The web renders those as a plain div
   *  rather than a disabled link, to avoid a keyboard dead-end; the native equivalent is simply
   *  not wrapping them in a Pressable, so they are not focusable by VoiceOver's controls either. */
  onPress?: () => void;
  /** Stands the whole tile down. Coming-soon subjects and modules, at the web's 0.55. */
  dimmed?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  children: ReactNode;
}

/** 9rem at the browser's 16px root — the radius of the web's wash. */
const WASH = 144;

export function CardShell({
  accent,
  onPress,
  dimmed = false,
  accessibilityLabel,
  style,
  children,
}: CardShellProps) {
  const { color } = useAppTheme();

  /**
   * Gradient ids are resolved globally by react-native-svg, not scoped to their own <Svg>. A
   * literal id would mean thirty cards in a grid all painting whichever accent mounted first —
   * so the id is derived from the accent, which makes cards sharing a colour share a definition
   * and cards of different colours keep their own.
   */
  const washId = `wash${accent?.replace(/[^a-z0-9]/gi, '') ?? ''}`;

  const body = (pressed: boolean) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: color.panel,
          borderColor: pressed && accent ? accent : color.panelBorder,
        },
        dimmed && styles.dimmed,
        pressed && styles.pressed,
        style,
      ]}
    >
      {/* Behind the content, clipped by the card's own overflow. Absent without an accent: an
          empty gradient is a wasted surface to composite on every card in a grid of thirty. */}
      {accent && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id={washId} cx="100%" cy="0%" rx={WASH} ry={WASH} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={accent} stopOpacity={ACCENT_WASH_OPACITY} />
              <Stop offset="0.72" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${washId})`} />
        </Svg>
      )}
      {children}
    </View>
  );

  if (!onPress) return body(false);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

/**
 * The name and its right-hand figure — a count, or a due pill. `baseline` alignment is what the
 * web uses and it matters here too: the two are different sizes and different weights, and
 * centring them makes the smaller one look like it is floating.
 */
export function CardNameRow({ children }: { children: ReactNode }) {
  return <View style={styles.nameRow}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    gap: SPACE.sm,
    // --shadow-1. Android takes the elevation, iOS the offset/opacity/radius.
    elevation: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  // The web lifts the tile 2px and deepens the accent on hover. A phone has no hover, so the
  // same budget is spent on the press state instead.
  pressed: { opacity: 0.75 },
  dimmed: { opacity: 0.55 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
});
