import { forwardRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';

/**
 * A ScrollView that keeps the focused field above the keyboard.
 *
 * Three screens take text — the licence code on `pricing`, email and password on the Account tab,
 * and one numeric field per formula on the Formulas tab — and all three were a plain ScrollView.
 * On each of them the field sits near the bottom of a long scroll, so the keyboard covered it
 * completely: a learner could not see the characters they were typing, could not put the caret in
 * the middle of a code to correct one, and on the numeric pad, which has no return key, could not
 * dismiss the keyboard either.
 *
 * Two mechanisms, because the platforms do not offer the same one:
 *
 *   * iOS gets `automaticallyAdjustKeyboardInsets`, which asks UIKit for the overlap and adds it
 *     as a content inset. The important part is that UIKit measures it — the correct value
 *     differs by whether the screen sits under a navigation header, over a tab bar, or neither,
 *     and these three screens are one of each. Every hand-computed `keyboardVerticalOffset` would
 *     have had to know which, and would have been wrong the day a screen moved.
 *   * Android has no such inset, so it wraps in `KeyboardAvoidingView`. `height` rather than
 *     `padding` because the view is the whole screen rather than a sheet, and the header height
 *     is a real offset there: the avoiding view measures from the top of the window, not from the
 *     top of the content.
 *
 * `expo-router/react-navigation` is the public re-export of the vendored navigation elements, so
 * `useHeaderHeight` costs no new dependency. There is no matching public export for the tab bar's
 * height, which is the other reason iOS takes the inset route instead.
 *
 * `TutorPanel` keeps its own `KeyboardAvoidingView`: it is a full-screen Modal with no header and
 * no tab bar above it, which is the one case where the offset is unambiguously zero.
 */
/**
 * The Android half, split into its own component so `useHeaderHeight` is never called on iOS.
 *
 * It throws outside a header context, and calling it unconditionally would make a headerless
 * screen crash on Android while working on iOS — the worst kind of platform bug to find later.
 */
function AndroidAvoiding({ style, children }: { style: ScrollViewProps['style']; children: React.ReactNode }) {
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView behavior="height" keyboardVerticalOffset={headerHeight} style={[styles.fill, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

export const KeyboardAwareScroll = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardAwareScroll({ children, style, ...rest }, ref) {
    const scroll = (
      <ScrollView
        ref={ref}
        style={Platform.OS === 'android' ? style : [styles.fill, style]}
        // A tap on a button while the keyboard is up must press the button, not merely dismiss the
        // keyboard. Without it, "Redeem" and "Sign in" both take two taps.
        keyboardShouldPersistTaps="handled"
        // `decimal-pad` has no return key, so dragging is the only way off the Formulas tab's
        // fields. `interactive` follows the finger, which is what every iOS app does.
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        {...rest}
      >
        {children}
      </ScrollView>
    );

    if (Platform.OS !== 'android') return scroll;
    return <AndroidAvoiding style={style}>{scroll}</AndroidAvoiding>;
  },
);

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
