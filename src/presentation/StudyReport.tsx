/**
 * What to work on next, and why. A port of the web's `src/home/StudyReport.tsx`.
 *
 * Hand-written here rather than file-synced: the web component is JSX plus a CSS module, and only
 * its `reasonText` prose is portable. That prose is copied verbatim so the two apps say the same
 * sentence about the same learner — reworded upstream, it has to be rewritten here, which the
 * comment above `reasonText` upstream already anticipates by keeping the words out of the pure
 * `weakness.ts` layer.
 *
 * It lives in `src/presentation/` and NOT beside its web counterpart in `src/home/`, which is a
 * sync-policed directory: `scripts/sync-engines.mjs` lists `src/home` in SYNCED_ONLY_DIRS and
 * `npm run sync:check` would report any file there with no web source as an orphan.
 *
 * Absent until something has been attempted, and absent again once nothing is weak. Being told
 * you have no weak spots is a result worth seeing rather than an empty table — which is why
 * `rankWeaknesses` returns only modules with something actually wrong with them.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WeakSpot, WeaknessReason } from '../shared/assessment/weakness';
import { MODULES } from '../home/moduleRegistry';
import { accentFrom, FONT, LINE, RADIUS, SPACE, TRACKING_TIGHT, useAppTheme, withAlpha } from './theme';

/** Beyond about five this stops being advice and becomes a list. */
const MAX_ROWS = 5;

function reasonText(spot: WeakSpot): string {
  const reasons: Record<WeaknessReason, string> = {
    repeatedLapses:
      spot.worstLapses === 2
        ? 'A question here has come back round and caught you twice.'
        : `A question here has caught you ${spot.worstLapses} times.`,
    lowAccuracy: `${spot.correct} of ${spot.attempted} right so far.`,
    stale:
      spot.daysSinceReview >= 60
        ? 'Answered well, but months ago now.'
        : `Answered well, but not for ${spot.daysSinceReview} days.`,
    thinCoverage: `${spot.unseen} of ${spot.totalQuestions} questions still unseen.`,
  };
  return reasons[spot.reason];
}

export function StudyReport({
  weakSpots,
  onOpenModule,
}: {
  weakSpots: readonly WeakSpot[];
  onOpenModule: (moduleId: string) => void;
}) {
  const { scheme, color } = useAppTheme();

  if (weakSpots.length === 0) return null;

  const byId = new Map(MODULES.map((module) => [module.id, module]));

  return (
    <View style={[styles.report, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Text style={[styles.title, { color: color.text }]}>Worth another look</Text>

      {weakSpots.slice(0, MAX_ROWS).map((spot) => {
        const module = byId.get(spot.moduleId);
        const accent = accentFrom(module?.accentColorVar, scheme, color.textDim);
        return (
          <Pressable
            key={spot.moduleId}
            onPress={() => onOpenModule(spot.moduleId)}
            accessibilityRole="button"
            accessibilityLabel={`${module?.name ?? spot.moduleId}. ${reasonText(spot)}`}
            style={({ pressed }) => [
              styles.row,
              { borderTopColor: color.panelBorder },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.rowHead}>
              <Text style={[styles.name, { color: accent }]}>{module?.name ?? spot.moduleId}</Text>
              {spot.dueCount > 0 && (
                <Text style={[styles.due, { color: accent, backgroundColor: withAlpha(accent, 0.1) }]}>
                  {spot.dueCount} due
                </Text>
              )}
            </View>
            <Text style={[styles.reason, { color: color.textDim }]}>{reasonText(spot)}</Text>
            <View style={[styles.meter, { backgroundColor: color.panelBorder }]}>
              <View
                style={[
                  styles.meterFill,
                  { width: `${Math.max(spot.mastery * 100, 2)}%`, backgroundColor: accent },
                ]}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  report: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.xl, paddingBottom: SPACE.lg },
  title: {
    fontSize: FONT.base,
    fontWeight: '700',
    letterSpacing: TRACKING_TIGHT,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.md,
  },
  row: { borderTopWidth: 1, paddingVertical: SPACE.lg, gap: SPACE.sm },
  pressed: { opacity: 0.6 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACE.md },
  name: { fontSize: FONT.sm, fontWeight: '700', flexShrink: 1 },
  due: {
    fontSize: FONT.micro,
    fontWeight: '700',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  reason: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.snug },
  meter: { height: 3, borderRadius: 2, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 2 },
});
