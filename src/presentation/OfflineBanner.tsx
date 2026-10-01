import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, SPACE, useAppTheme } from './theme';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * A strip under the status bar while the device is offline. The simulators and the quiz run
 * on-device, so it says what still works rather than blocking anything; each screen that needs
 * the network carries its own Retry.
 */
export function OfflineBanner() {
  const online = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  if (online !== false) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        { backgroundColor: color.panel, borderBottomColor: color.panelBorder, paddingTop: insets.top + SPACE.xs },
      ]}
    >
      <Text style={[styles.text, { color: color.text }]}>
        You&rsquo;re offline. Simulators still work; sign-in, the tutor and syncing need a connection.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { fontSize: FONT.xs },
});
