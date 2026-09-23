import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModuleCase } from '../shared/cases/types';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';

export interface CaseHeaderProps {
  patient: ModuleCase<string, any>;
  /** Which scenario is actually loaded right now. */
  activePreset: string | null;
  presetLabels: Record<string, string>;
  /** Puts the patient back. Wired to the module's own scenario applier. */
  onReturn: () => void;
  /** Whether the engine is running, for the monitor line. */
  playing: boolean;
  accent: string;
}

/**
 * Who is in the bed, on the Lab tab.
 *
 * Deliberately slim. The live observations live in `ClinicPanel`, where they sit with the
 * history and the questions they are evidence for; keeping a copy here would put a chart a
 * swipe above the readout grid saying much the same thing. What is left is the part the lab
 * genuinely needs: whose physiology these sliders are.
 *
 * **It goes stale honestly.** Nothing stops a learner pressing another scenario while a bed
 * is picked, and a banner that kept asserting the patient's name over somebody else's
 * physiology would be the one genuinely dishonest surface here — every other number is read
 * from the engine. So when the loaded scenario diverges from the patient's, the one-liner
 * gives way to a note and a way back.
 */
export function CaseHeader({
  patient,
  activePreset,
  presetLabels,
  onReturn,
  playing,
  accent,
}: CaseHeaderProps) {
  const { color } = useAppTheme();
  // Null means "no scenario applied yet", which is the state a freshly picked bed is in
  // before anyone touches the scenario bar — not a divergence.
  const strayed = activePreset !== null && activePreset !== patient.preset;
  const scenario = presetLabels[activePreset ?? patient.preset] ?? activePreset ?? patient.preset;

  return (
    <View
      style={[styles.banner, { backgroundColor: color.panel, borderColor: color.panelBorder }]}
      accessibilityLabel={`Bedside: ${patient.name}`}
    >
      <View style={styles.identity}>
        <Text style={[styles.who, { color: color.text }]}>
          {patient.name}, {patient.age}
        </Text>
        <Text style={[styles.register, { color: color.textDim }]}>
          {patient.bed} · {scenario} · {playing ? 'Live' : 'Paused'}
        </Text>
      </View>
      {strayed ? (
        <>
          <Text style={[styles.note, { color: color.textDim }]}>
            These are no longer {patient.name}&apos;s numbers — the scenario changed under them.
          </Text>
          <Pressable
            onPress={onReturn}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.returnButton,
              { borderColor: accent, backgroundColor: withAlpha(accent, 0.1) },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.returnText, { color: accent }]}>Back to {patient.name}</Text>
          </Pressable>
        </>
      ) : (
        <Text style={[styles.oneLiner, { color: color.textDim }]}>{patient.oneLiner}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    gap: SPACE.sm,
  },
  identity: { gap: 2 },
  who: { fontSize: FONT.base, fontWeight: '700' },
  register: { fontSize: FONT.micro, lineHeight: FONT.micro * LINE.snug },
  oneLiner: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  note: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  returnButton: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACE.xl,
  },
  returnText: { fontSize: FONT.sm, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
