/**
 * The pill on a card — "Coming soon", "Full access", "Reference".
 *
 * One component because the web's three `.badge` rules are the same rule, and the only variant
 * that differs is the locked one, which strengthens rather than dims: a locked module has to look
 * worth buying, and a half-opacity tile does not sell anything.
 */
import { StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, useAppTheme } from '../theme';

export function Badge({ label, emphasised = false }: { label: string; emphasised?: boolean }) {
  const { color } = useAppTheme();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color.panel, borderColor: emphasised ? color.textFaint : color.panelBorder },
      ]}
    >
      <Text style={[styles.text, { color: emphasised ? color.text : color.textFaint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 2,
    paddingHorizontal: SPACE.md,
  },
  text: { fontSize: FONT.micro, fontWeight: '600', letterSpacing: 0.6 },
});
