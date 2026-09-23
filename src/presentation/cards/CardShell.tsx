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
import { useCallback, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import { ACCENT_WASH_OPACITY, DURATION, EASE, RADIUS, SPACE, useAppTheme } from '../theme';
import { useReduceMotion } from '../useReduceMotion';

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

/** How far the tile sinks under a finger. The web's card lifts 2px on hover and settles back to
 *  0.99 on `:active`; with no hover to lift from, the press is the whole of the gesture here. */
const PRESS_SCALE = 0.97;

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

  /**
   * The press, animated rather than switched.
   *
   * The opacity swap below was instant, so a tile went dim and back with no sense of being pushed,
   * and a navigation that then takes a moment to arrive read as a tap that had not registered. A
   * scale gives the press somewhere to go.
   *
   * React Native's own `Animated` rather than Reanimated, for the reason `ControlDock` sets out:
   * Reanimated is a transitive dependency here at a version expo-router does not pin, there is no
   * `GestureHandlerRootView` at the root, and `babel.config.js` carries none of its plugins. Unlike
   * the dock's height, a scale IS a transform, so this one runs on the UI thread — which matters on
   * a grid of thirty tiles and on the frame where opening a module settles its engine.
   *
   * A lazy `useState` rather than a ref because the value is read during render to build the
   * transform, which is what `react-hooks/refs` forbids a ref to be used for.
   */
  const [press] = useState(() => new Animated.Value(0));
  const reduceMotion = useReduceMotion();
  const animatePress = useCallback(
    (down: boolean) => {
      Animated.timing(press, {
        toValue: down ? 1 : 0,
        duration: reduceMotion ? 0 : DURATION.fast,
        easing: Easing.bezier(...EASE),
        useNativeDriver: true,
      }).start();
    },
    [press, reduceMotion],
  );
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, PRESS_SCALE] });

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
    <Pressable
      onPress={onPress}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {({ pressed }) => <Animated.View style={{ transform: [{ scale }] }}>{body(pressed)}</Animated.View>}
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
  // same budget is spent on the press state instead — now a scale as well as this, so the tile
  // moves under the finger rather than only changing colour.
  pressed: { opacity: 0.75 },
  dimmed: { opacity: 0.55 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
});
