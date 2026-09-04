/**
 * The slider rail as a bottom dock: collapsed to a transport bar, raised on tap.
 *
 * The rail used to sit inline in the module screen's ScrollView, between the readout grid and the
 * trends chart, permanently expanded. Five sliders is roughly 400pt of a phone screen a learner
 * could not dismiss, and it pushed the trends chart — the thing a control is being moved to
 * change — a screen and a half down.
 *
 * This is the web's phone layout ported over: a fixed bar carrying the transport and a `Controls`
 * handle, with the sliders sliding up behind it. It starts collapsed, so a module opens on its
 * diagram, readouts and traces.
 *
 * Animated with React Native's own `Animated` rather than Reanimated on purpose — Reanimated and
 * gesture-handler are only transitive dependencies here, at versions expo-router does not itself
 * pin, and there is no `GestureHandlerRootView` at the root. A 200ms height transition is not
 * worth taking that on.
 */
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ControlRailView } from './ControlRailView';
import { SimControls } from './SimControls';
import type { ControlSpec } from './types';
import type { NativeSimTransport } from '../hooks/useNativeEngineLoop';
import { SPACE, useAppTheme } from './theme';

/** The web caps its tray at 55svh. Half the window leaves the readout strip and the diagram
 *  visible above it, which is the point of dragging a slider at all. */
const MAX_TRAY_FRACTION = 0.5;

const DURATION_MS = 200;

interface ControlDockProps<Inputs> {
  controls: readonly ControlSpec<Inputs>[];
  inputs: Inputs;
  onChange: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;
  accent: string;
  transport: NativeSimTransport;
  /** Reports the collapsed height, so the page above can reserve room for it. */
  onHeadLayout: (height: number) => void;
}

export function ControlDock<Inputs>({
  controls,
  inputs,
  onChange,
  accent,
  transport,
  onHeadLayout,
}: ControlDockProps<Inputs>) {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const hasControls = controls.length > 0;
  const [open, setOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  // A lazy useState rather than a ref: this is read during render to build the interpolation,
  // which is exactly what `react-hooks/refs` forbids a ref to be used for.
  const [progress] = useState(() => new Animated.Value(0));

  // The same courtesy the web extends with `prefers-reduced-motion`.
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (live) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: reduceMotion ? 0 : DURATION_MS,
      easing: Easing.bezier(0.2, 0, 0, 1),
      // Height is not a transform, so this cannot run off the JS thread.
      useNativeDriver: false,
    }).start();
  }, [open, reduceMotion, progress]);

  /**
   * The cap is a constant, and the ScrollView below is given it as an explicit height, because a
   * ScrollView inside a collapsed (height 0) wrapper never lays its content out and so never
   * reports a content size — the tray would measure 0 and refuse to open. With a real frame it
   * measures at mount, and the wrapper animates to whichever of the two is smaller.
   */
  const cap = Math.round(windowHeight * MAX_TRAY_FRACTION);
  const trayHeight = contentHeight > 0 ? Math.min(contentHeight, cap) : cap;

  return (
    <View
      style={[
        styles.dock,
        {
          backgroundColor: color.panel,
          borderTopColor: color.panelBorder,
          // The web's dock sits under the home indicator; this one does not.
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        style={styles.head}
        onLayout={(e) => onHeadLayout(e.nativeEvent.layout.height)}
      >
        <SimControls
          transport={transport}
          accent={accent}
          open={open}
          onToggle={hasControls ? () => setOpen((v) => !v) : undefined}
        />
      </View>

      {hasControls && (
        <Animated.View
          style={[
            styles.tray,
            {
              borderTopColor: color.panelBorder,
              height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, trayHeight] }),
            },
          ]}
        >
          <ScrollView
            style={{ height: cap }}
            contentContainerStyle={styles.trayContent}
            onContentSizeChange={(_w, h) => setContentHeight(h)}
          >
            <ControlRailView
              controls={controls}
              inputs={inputs}
              onChange={onChange}
              accent={accent}
            />
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    borderTopWidth: 1,
    // The web's `box-shadow: 0 -4px 16px`, which is what separates the dock from the trace
    // scrolling underneath it.
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  head: { paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md },
  tray: { overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth },
  trayContent: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg, paddingBottom: SPACE.lg },
});
