import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the learner has asked iOS or Android to reduce motion — the same courtesy the web extends
 * through `prefers-reduced-motion`.
 *
 * Subscribed rather than read once, because the setting is reachable from Control Centre and from
 * the accessibility shortcut, so it can change while a module is open. Every animated surface here
 * collapses its duration to zero rather than removing the animation, which matches what the web's
 * blanket rule does: the end state still arrives, it just arrives immediately.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (live) setReduceMotion(enabled);
    });
    // Optional, and not defensiveness for its own sake: `react-native-web` returns nothing for
    // `reduceMotionChanged`, so the unguarded form throws on unmount everywhere RNW runs — under
    // test, and in a web build. `ControlDock` carried the same line for months without failing
    // only because nothing ever mounted it in a test.
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion) as
      | { remove: () => void }
      | undefined;
    return () => {
      live = false;
      sub?.remove();
    };
  }, []);
  return reduceMotion;
}
