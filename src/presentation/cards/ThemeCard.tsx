/**
 * A tile for one theme, linking to its page of module cards. Sized like a ModuleCard so the two
 * grids read as the same navigation surface, which is what the web's shared card chrome is for.
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeDescriptor } from '../../home/moduleRegistry';
import { accentFrom, FONT, LINE, TRACKING_TIGHT, useAppTheme } from '../theme';
import { CardNameRow, CardShell } from './CardShell';

interface ThemeCardProps {
  theme: ThemeDescriptor;
  moduleCount: number;
  /** Overrides the "N simulators" count — for a theme that is a browseable hub rather than a set
   *  of simulators, which is the medications theme. */
  countText?: string;
  onPress: () => void;
}

export function ThemeCard({ theme, moduleCount, countText, onPress }: ThemeCardProps) {
  const { scheme, color } = useAppTheme();
  const accent = accentFrom(theme.accentColorVar, scheme, color.panelBorder);
  const count = countText ?? `${moduleCount} simulator${moduleCount === 1 ? '' : 's'}`;

  return (
    <CardShell accent={accent} onPress={onPress} accessibilityLabel={`${theme.name}, ${count}`}>
      <CardNameRow>
        <Text style={[styles.name, { color: color.text }]}>{theme.name}</Text>
        <View style={styles.right}>
          <Text style={[styles.count, { color: color.textDim }]}>{count}</Text>
          <Ionicons name="chevron-forward" size={16} color={color.textFaint} />
        </View>
      </CardNameRow>
      <Text style={[styles.blurb, { color: color.textDim }]}>{theme.blurb}</Text>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: TRACKING_TIGHT, flexShrink: 1 },
  count: { fontSize: FONT.micro, fontWeight: '700', letterSpacing: 0.4 },
  blurb: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.snug },
});
