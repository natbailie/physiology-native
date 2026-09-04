/**
 * Light / Dark / Follow device, mirroring the web's ThemeToggle.
 *
 * `system` is a real third state rather than the absence of a choice, which is the same call the
 * web's `useTheme.ts` makes: a learner who has not chosen should follow their device, including
 * when the device changes at dusk. Before this the native app had no control at all and tracked
 * `useColorScheme()` unconditionally.
 */
import { StyleSheet, Text, View } from 'react-native';
import { SegmentedControl } from './SegmentedControl';
import { FONT, SPACE, useAppTheme, type ThemePreference } from './theme';

const SEGMENTS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'Device' },
] satisfies readonly { value: ThemePreference; label: string }[];

export function ThemeToggle() {
  const { preference, setPreference, color } = useAppTheme();
  return (
    <View style={styles.block}>
      <SegmentedControl
        segments={SEGMENTS}
        value={preference}
        onChange={setPreference}
        accessibilityLabel="Appearance"
      />
      <Text style={[styles.hint, { color: color.textFaint }]}>
        {preference === 'system'
          ? 'Following your device setting.'
          : `Always ${preference}, whatever the device does.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: SPACE.md },
  hint: { fontSize: FONT.xs },
});
