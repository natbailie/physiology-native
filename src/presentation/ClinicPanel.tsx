import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isPatternQuestion, type ModuleQuestion } from '../shared/assessment/types';
import type { ReviewState } from '../shared/assessment/scheduling';
import { acuityOf, type Acuity } from '../shared/cases/acuity';
import type { ModuleCase } from '../shared/cases/types';
import { ReadoutTile } from './ReadoutTile';
import { PatternRow, PredictRow, type CommittedAnswer } from './QuestionRows';
import { useSettledQuestions } from './useSettledQuestions';
import { Badge } from './cards/Badge';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';

/** The word on the chip. Colour is the second carrier here, never the only one. */
const ACUITY_LABEL: Record<Acuity, string> = {
  crash: 'CRASH',
  due: 'DUE',
  check: 'CHECK',
  newAdmission: 'NEW',
};

export interface ClinicPanelProps {
  cases: readonly ModuleCase<string, any>[];
  patient: ModuleCase<string, any> | null;
  onSelectBed: (bedId: string | null) => void;
  /** This module's review ladder, for the acuity chips. Derived, never authored — see acuity.ts. */
  schedule: Record<string, ReviewState>;
  /** The live loop snapshot the idle chart reads. Null before the engine has produced one. */
  snapshot: unknown;
  /** This bed's questions — the Patients tab runs these and nothing else. */
  questions: readonly ModuleQuestion<any, any, any>[];
  moduleId: string;
  accent: string;
  committed: ReadonlyMap<string, CommittedAnswer>;
  onCommit: (questionId: string, picked: string, correct: boolean) => void;
  presetLabels: Record<string, string>;
  /** One line per scenario for a pattern question\'s options; see `QuestionRows`. */
  presetGloss?: Record<string, string>;
  config: any;
  defaults: any;
  presets: Record<string, any>;
  onOpenScenario?: (presetId: string) => void;
  onRunQuestion?: (questionId: string) => void;
}

/**
 * The Patients tab: who is in the bed, what happened to them, what their numbers are doing,
 * and the questions that make the connection.
 *
 * The order is the argument: history, then observations, then the questions, and only then
 * the payoff, which stays off screen until every bed question is committed.
 *
 * The chart reads the LIVE loop while the bed is fresh — and then gets out of the way. A
 * committed answer means the engine may have been explored since, while the questions settle
 * offline and never touch the loop: a live chart past that point could caption explored
 * numbers with the patient's name. Each row carries its own settled panel, which is the
 * reference once the bed is engaged.
 */
export function ClinicPanel({
  cases,
  patient,
  onSelectBed,
  schedule,
  snapshot,
  questions,
  moduleId,
  accent,
  committed,
  onCommit,
  presetLabels,
  presetGloss,
  config,
  defaults,
  presets,
  onOpenScenario,
  onRunQuestion,
}: ClinicPanelProps) {
  const { color } = useAppTheme();
  const settled = useSettledQuestions(config, defaults, presets, questions);

  const engaged = questions.some((q) => committed.has(q.id));
  const complete = questions.length > 0 && questions.every((q) => committed.has(q.id));

  // Read once, not per row: a clock read in the render body re-evaluates every frame.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <View style={styles.panel}>
      <View style={styles.picker}>
        {cases.map((entry) => {
          const selected = entry.id === patient?.id;
          const acuity = acuityOf(schedule, entry.questionIds ?? [], now);
          // A selected bed is filled with the module accent, and a signal colour on a saturated
          // accent is not readable at any size — measured across all 12 bedded modules and both
          // themes, every acuity word came out between 1.00 and 1.60:1. `--on-solid` is the token
          // that exists for text on a solid signal, which is why `bedText` below already uses it;
          // the chip now agrees with the word beside it about what ground it is on.
          const tone = selected
            ? color.onSolid
            : acuity === 'crash'
              ? color.danger
              : acuity === 'due'
                ? color.warn
                : acuity === 'check'
                  ? color.ok
                  : color.textFaint;
          return (
            <Pressable
              key={entry.id}
              onPress={() => onSelectBed(selected ? null : entry.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${entry.name}, ${entry.age}. ${ACUITY_LABEL[acuity]}`}
              style={({ pressed }) => [
                styles.bed,
                {
                  backgroundColor: selected ? accent : color.panel,
                  borderColor: selected ? accent : color.panelBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <Badge label={ACUITY_LABEL[acuity]} tone={tone} />
              <Text style={[styles.bedText, { color: selected ? color.onSolid : color.text }]}>
                {entry.name}, {entry.age}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {patient && (
        <>
          <Text style={[styles.who, { color: color.text }]}>
            {patient.name}, {patient.age}
          </Text>
          <Text style={[styles.oneLiner, { color: color.textDim }]}>{patient.oneLiner}</Text>
          <Text style={[styles.presentation, { color: color.text }]}>{patient.presentation}</Text>
        </>
      )}

      {snapshot !== null && snapshot !== undefined && patient && !engaged && (
        <>
          <View style={styles.chart}>
            {patient.chart.map((field) => (
              <ReadoutTile
                key={field.label}
                label={field.label}
                moduleId={moduleId}
                value={formatReading(field.value(snapshot), field.decimals)}
                unit={field.unit}
              />
            ))}
          </View>
          <Text style={[styles.caption, { color: color.textDim }]}>
            {patient.name}&apos;s observations, read live off the simulation.
          </Text>
        </>
      )}

      {patient && !engaged && <Text style={[styles.task, { color: color.text }]}>{patient.task}</Text>}

      {questions.map((q) =>
        isPatternQuestion(q) ? (
          <PatternRow
            key={q.id}
            question={q as never}
            panel={settled?.patternPanels.get(q.id) ?? null}
            accent={accent}
            presetLabels={presetLabels}
            presetGloss={presetGloss}
            committed={committed.get(q.id) ?? null}
            onOpenScenario={onOpenScenario}
            onCommit={onCommit}
          />
        ) : (
          <PredictRow
            key={q.id}
            question={q as any}
            outcome={settled?.outcomes.get(q.id) ?? null}
            accent={accent}
            committed={committed.get(q.id) ?? null}
            onOpenScenario={onOpenScenario}
            onRunQuestion={onRunQuestion}
            onCommit={onCommit}
          />
        ),
      )}

      {patient && complete && (
        <View style={[styles.teaching, { borderColor: withAlpha(accent, 0.5) }]}>
          <Text style={[styles.teachingLabel, { color: color.textDim }]}>What this bed teaches</Text>
          <Text style={[styles.teachingText, { color: color.text }]}>{patient.teaching}</Text>
        </View>
      )}

      {!patient && (
        <Text style={[styles.caption, { color: color.textDim }]}>
          Choose a patient to see their history, their observations and their questions.
        </Text>
      )}
    </View>
  );
}

/** Display rounding for a chart accessor, which carries its own stated decimals. */
function formatReading(value: number, decimals?: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(decimals ?? 1);
}

const styles = StyleSheet.create({
  panel: { gap: SPACE.lg },
  picker: { flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap' },
  bed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  bedText: { fontSize: FONT.sm, fontWeight: '700' },
  pressed: { opacity: 0.6 },
  who: { fontSize: FONT.xl, fontWeight: '700' },
  oneLiner: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  presentation: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  task: { fontSize: FONT.sm, fontWeight: '700' },
  chart: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md },
  caption: { fontSize: FONT.xs },
  teaching: {
    borderLeftWidth: 3,
    paddingVertical: SPACE.sm,
    paddingLeft: SPACE.lg,
    gap: SPACE.xs,
  },
  teachingLabel: { fontSize: FONT.micro, fontWeight: '700' },
  teachingText: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
});
