/**
 * Haptic feedback, wrapped so callers never have to think about the platform.
 *
 * Every one of these is fire-and-forget and swallows its rejection on purpose: haptics are absent
 * on a simulator, absent on most Android hardware, and can be switched off system-wide. None of
 * that is a condition a control should surface, and an unhandled rejection in a press handler
 * would be.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

/** A value changed: a stepper press, a toggle, a preset, a segment. */
export function selectionTick() {
  if (!supported) return;
  void Haptics.selectionAsync().catch(() => {});
}

/** An answer was marked. The two outcomes get different textures on purpose — after a few
 *  questions the hand knows the result before the eye reads it. */
export function answerFeedback(correct: boolean) {
  if (!supported) return;
  void Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
  ).catch(() => {});
}
