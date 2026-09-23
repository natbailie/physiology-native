import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { DURATION, EASE, SPACE } from './theme';
import { useReduceMotion } from './useReduceMotion';

/**
 * Fades a module's tab content in when the tab changes.
 *
 * The strip switched instantly, which on the two heaviest tabs — the lab, with a diagram and a grid
 * of readouts, and Lessons, with the whole explainer — reads as the screen being replaced rather
 * than as a view changing. The web reaches the same result with a keyframe on the panel that has
 * just stopped being `display: none`; there is no such thing here, because the tab content really
 * is unmounted, so the fade is driven by the key changing instead.
 *
 * An arrival, not a crossfade, for the same reason as on the web: only one tab's content exists at
 * a time, so there is no outgoing half to fade against. Opacity only — nothing may move, because
 * the ScrollView's offset and the dock's measured height are both read against this content.
 */
export function TabFade({ tabKey, children }: { tabKey: string; children: ReactNode }) {
  // Read during render to build the style, so a lazy useState rather than a ref.
  const [opacity] = useState(() => new Animated.Value(1));
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: reduceMotion ? 0 : DURATION.base,
      easing: Easing.bezier(...EASE),
      useNativeDriver: true,
    }).start();
  }, [tabKey, opacity, reduceMotion]);

  return <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  // Inherits the content container's column flow and gap rather than introducing a second one:
  // the tabs' sections are laid out by the ScrollView's `contentContainerStyle`, and a wrapper
  // with its own padding or spacing would shift every one of them.
  fill: { flexDirection: 'column', gap: SPACE.xl },
});
