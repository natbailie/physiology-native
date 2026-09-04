/**
 * A home tile for one subject — the tier above themes. Ported from the web's DisciplineCard.
 *
 * An unbuilt subject renders as an inert tile rather than a disabled button, which is the same
 * call the web makes and for a related reason: there, a disabled link is a keyboard dead end;
 * here, a Pressable that does nothing still announces itself to VoiceOver as a button.
 * The roadmap is part of what the picker is saying, so the tile stays visible either way.
 */
import { StyleSheet, Text } from 'react-native';
import type { DisciplineDescriptor } from '../../home/moduleRegistry';
import { accentFrom, FONT, LINE, TRACKING_TIGHT, useAppTheme } from '../theme';
import { Badge } from './Badge';
import { CardNameRow, CardShell } from './CardShell';

interface DisciplineCardProps {
  discipline: DisciplineDescriptor;
  /** The right-hand figure, e.g. "12 simulators" or "62 classes". */
  countText?: string;
  /** Absent for a coming-soon subject, which has nowhere to go. */
  onPress?: () => void;
}

export function DisciplineCard({ discipline, countText, onPress }: DisciplineCardProps) {
  const { scheme, color } = useAppTheme();
  const accent = accentFrom(discipline.accentColorVar, scheme, color.panelBorder);
  const unavailable = discipline.status === 'comingSoon' || !onPress;

  return (
    <CardShell
      accent={accent}
      onPress={unavailable ? undefined : onPress}
      dimmed={unavailable}
      accessibilityLabel={`${discipline.name}${countText ? `, ${countText}` : ''}`}
    >
      <CardNameRow>
        <Text style={[styles.name, { color: color.text }]}>{discipline.name}</Text>
        {!unavailable && countText && (
          <Text style={[styles.count, { color: color.textDim }]}>{countText}</Text>
        )}
      </CardNameRow>
      <Text style={[styles.blurb, { color: color.textDim }]}>{discipline.blurb}</Text>
      {unavailable && <Badge label="Coming soon" />}
    </CardShell>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: TRACKING_TIGHT, flexShrink: 1 },
  count: { fontSize: FONT.micro, fontWeight: '700', letterSpacing: 0.4 },
  blurb: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.snug },
});
