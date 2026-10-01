import { Image, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, useAppTheme } from '../theme';

interface LogoProps {
  size?: number;
  /** Also writes the product name beside the mark. */
  withName?: boolean;
}

/**
 * The app icon as an in-app mark, so the logo is seen on screen and not only on the home screen
 * of the phone. Decorative: the name beside it (or the heading near it) carries the meaning.
 */
export function Logo({ size = 32, withName = false }: LogoProps) {
  const { color } = useAppTheme();
  return (
    <View style={styles.row} accessible={withName} accessibilityLabel={withName ? 'Physiology Lab' : undefined}>
      <Image
        source={require('../../../assets/icon.png')}
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
      />
      {withName && <Text style={[styles.name, { color: color.text }]}>Physiology Lab</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  name: { fontSize: FONT.base, fontWeight: '700', borderRadius: RADIUS.sm },
});
