/**
 * A tile for one simulator. Ported from the web's ModuleCard, including the three states the
 * native list did not have: coming-soon, locked, and the progress affordances.
 *
 * A locked module stays tappable and routes to pricing rather than being greyed out or removed.
 * The web's stylesheet is blunt about why — "a locked module ... has to look worth buying, which
 * a half-opacity tile does not" — and it matters more here, because until this change the native
 * app shipped all 45 modules open and a learner has never seen the boundary.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { ModuleDescriptor } from '../../home/moduleRegistry';
import { accentFrom, FONT, LINE, RADIUS, TRACKING_TIGHT, useAppTheme, withAlpha } from '../theme';
import { Badge } from './Badge';
import { CardNameRow, CardShell } from './CardShell';

interface ModuleCardProps {
  module: ModuleDescriptor;
  /** How much of the module is known, 0-1. Undefined means never attempted, and the meter is then
   *  absent entirely — an untouched grid should stay a grid rather than a wall of empty bars. */
  mastery?: number;
  dueCount?: number;
  /** Outside the learner's entitlement: the card points at pricing rather than the module. */
  locked?: boolean;
  onPress: () => void;
  /** Where a locked tile goes instead. */
  onPressLocked: () => void;
}

export function ModuleCard({
  module,
  mastery,
  dueCount = 0,
  locked = false,
  onPress,
  onPressLocked,
}: ModuleCardProps) {
  const { scheme, color } = useAppTheme();
  const accent = accentFrom(module.accentColorVar, scheme, color.panelBorder);

  if (module.status === 'comingSoon') {
    return (
      <CardShell accent={accent} dimmed accessibilityLabel={`${module.name}, coming soon`}>
        <Text style={[styles.name, { color: color.text }]}>{module.name}</Text>
        <Text style={[styles.tagline, { color: color.textDim }]}>{module.tagline}</Text>
        <Badge label="Coming soon" />
      </CardShell>
    );
  }

  if (locked) {
    return (
      <CardShell
        accent={accent}
        onPress={onPressLocked}
        accessibilityLabel={`${module.name} — included with full access`}
      >
        <Text style={[styles.name, { color: color.textDim }]}>{module.name}</Text>
        <Text style={[styles.tagline, { color: color.textDim }]}>{module.tagline}</Text>
        <Badge label="Full access" emphasised />
      </CardShell>
    );
  }

  return (
    <CardShell accent={accent} onPress={onPress} accessibilityLabel={module.name}>
      <CardNameRow>
        <Text style={[styles.name, { color: color.text }]}>{module.name}</Text>
        {dueCount > 0 && (
          <Text
            style={[styles.due, { color: accent, backgroundColor: withAlpha(accent, 0.1) }]}
            accessibilityLabel={`${dueCount} due for review`}
          >
            {dueCount} due
          </Text>
        )}
      </CardNameRow>
      <Text style={[styles.tagline, { color: color.textDim }]}>{module.tagline}</Text>
      {module.kind === 'reference' && <Badge label="Reference" />}
      {mastery !== undefined && (
        <View
          style={[styles.meter, { backgroundColor: color.panelBorder }]}
          accessibilityLabel={`${Math.round(mastery * 100)} per cent known`}
        >
          {/* Floored at 2% so a first correct answer is visible rather than a rounding artefact,
              which is what the web's `Math.max(mastery * 100, 2)` is doing. */}
          <View
            style={[styles.meterFill, { width: `${Math.max(mastery * 100, 2)}%`, backgroundColor: accent }]}
          />
        </View>
      )}
    </CardShell>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: TRACKING_TIGHT, flexShrink: 1 },
  tagline: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.snug },
  due: {
    fontSize: FONT.micro,
    fontWeight: '700',
    letterSpacing: 0.4,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  // A hairline rather than a progress bar: it has to read at a glance across a grid without any
  // single card shouting.
  meter: { height: 3, borderRadius: 2, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 2 },
});
