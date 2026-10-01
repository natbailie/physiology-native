import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface GradientBoxProps {
  /** Two or more stops, start to end. */
  colors: readonly [string, string, ...string[]];
  /** Top-left to bottom-right by default, which is the diagonal the web's hero uses. */
  direction?: 'diagonal' | 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * A box with a smooth linear gradient behind its children.
 *
 * `react-native-svg` is already a dependency (the diagrams, the card wash), so this costs no native
 * rebuild the way `expo-linear-gradient` would.
 *
 * Two things here are deliberate, both learned on a device:
 *
 *   * The box MEASURES itself and hands the `<Svg>` numeric pixel sizes. Giving it `width="100%"`
 *     resolved against the wrong ancestor inside a stretched `Pressable` on iOS and drew the
 *     gradient 87% of the way across a full-width button with a square right edge.
 *   * The id comes from `useId`, because react-native-svg resolves gradient ids globally, not per
 *     `<Svg>` — two boxes sharing a literal id would paint whichever mounted first (the same trap
 *     `CardShell`'s wash documents).
 */
export function GradientBox({ colors, direction = 'diagonal', style, children }: GradientBoxProps) {
  const id = `grad${useId().replace(/[^a-z0-9]/gi, '')}`;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [x2, y2] = direction === 'diagonal' ? ['1', '1'] : direction === 'horizontal' ? ['1', '0'] : ['0', '1'];

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={[styles.box, style]} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
              {colors.map((stop, i) => (
                <Stop key={`${stop}-${i}`} offset={String(i / (colors.length - 1))} stopColor={stop} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
});
