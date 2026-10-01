import { Pressable, StyleSheet, Text } from 'react-native';
import { FONT, RADIUS, SPACE, TAP, useAppTheme } from './theme';

/** The one "try that again" control, so every failed load offers the same thing. */
export function RetryButton({ onPress, label = 'Retry' }: { onPress: () => void; label?: string }) {
  const { color } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { borderColor: color.brand }, pressed && styles.pressed]}
    >
      <Text style={[styles.text, { color: color.brand }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: TAP,
    paddingHorizontal: SPACE.xl,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: FONT.sm, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
