import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { RADIUS, useAppTheme } from '../theme';
import { useReduceMotion } from '../useReduceMotion';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** A round blob (avatar, icon tile) rather than a rounded bar. */
  round?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A placeholder for content on its way, so a screen keeps its shape while something loads instead
 * of showing a spinner and then jumping.
 *
 * A soft pulse on the native driver; under Reduce Motion it holds still, which still reads as
 * "not here yet". Hidden from VoiceOver — the region that owns it should say what it is waiting for.
 */
export function Skeleton({ width = '100%', height = 16, round = false, style }: SkeletonProps) {
  const { color } = useAppTheme();
  const reduceMotion = useReduceMotion();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Animated.View
      aria-hidden
      style={[
        styles.base,
        { width, height, opacity, backgroundColor: color.panelRaised },
        round && { borderRadius: RADIUS.pill },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: RADIUS.sm },
});
