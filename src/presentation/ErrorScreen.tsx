import { StyleSheet, Text, View } from 'react-native';
import { FONT, LINE, SPACE, TRACKING_TIGHT, useAppTheme } from './theme';
import { Button } from './ui/Button';
import { Illustration } from './ui/Illustration';

interface Props {
  title: string;
  message: string;
  /** The label and handler of the single way out. Omit both for a screen with nothing to retry. */
  action?: { label: string; onPress: () => void };
}

/**
 * The plain "something went wrong here" screen, shared by the render-error boundary and the
 * not-found route so a crash and a dead link look like the same app. It reads the theme through
 * `useAppTheme`, and both callers sit under the root layout's providers, so it never needs a
 * provider of its own to draw.
 *
 * One full-width way forward. The illustration and the words are there so a learner reads "that
 * one's on us" before they read "error".
 */
export function ErrorScreen({ title, message, action }: Props) {
  const { color } = useAppTheme();
  return (
    <View style={[styles.root, { backgroundColor: color.bg }]}>
      <Illustration kind="error" size={140} />
      <Text accessibilityRole="header" style={[styles.title, { color: color.text }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: color.textDim }]}>{message}</Text>
      {action && (
        <View style={styles.actions}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.xxl, gap: SPACE.xl },
  title: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: TRACKING_TIGHT, textAlign: 'center' },
  message: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: SPACE.md, marginTop: SPACE.md },
});
