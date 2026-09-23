import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isPatternQuestion, type ModuleQuestion } from '../shared/assessment/types';
import { dueQuestions, type ReviewState } from '../shared/assessment/scheduling';
import type { ModuleCase } from '../shared/cases/types';
import { PatternRow, PredictRow, type CommittedAnswer } from './QuestionRows';
import { useSettledQuestions } from './useSettledQuestions';
import { FONT, LINE, SPACE, useAppTheme } from './theme';

export interface QuestionSetProps {
  /** How many questions this tab runs. */
  count: number;
  /** The module's beds, so work waiting at one can be pointed at. */
  beds: readonly ModuleCase<string, any>[];
  /** This module's review ladder — which bed questions have come due. */
  schedule: Record<string, ReviewState>;
  /** This tab's questions: what the beds do not claim. */
  questions: readonly ModuleQuestion<any, any, any>[];
  /** Jump to a bedside: picks the bed and opens the Patients tab. */
  onGoBedside: (bedId: string) => void;
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
 * The Questions tab: what the beds do not claim.
 *
 * The questions whose scenario has no bed, and the mechanism drills tied to no presentation
 * at all. A learner revising the mechanism rather than the ward wants exactly this set, and
 * putting it behind a patient would have been the wrong door.
 *
 * It also carries the pointer to work waiting elsewhere: splitting practice across beds
 * scopes due counts per tab, so without this a learner whose due questions are all one tab
 * over would land here with nothing saying so.
 */
export function QuestionSet({
  count,
  beds,
  schedule,
  questions,
  onGoBedside,
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
}: QuestionSetProps) {
  const { color } = useAppTheme();
  const settled = useSettledQuestions(config, defaults, presets, questions);

  // Due dates move on day granularity; re-reading the clock every render buys nothing, and the
  // purity rule forbids the call anywhere render-phase — including a memo factory — so the one
  // render-time read this needs carries its justification with it, as the web's identical line does.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const waiting = beds
    .map((bed) => ({ bed, due: dueQuestions(schedule, bed.questionIds ?? [], now).length }))
    .filter((entry) => entry.due > 0);

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: color.text }]}>Questions</Text>
        <Text style={[styles.blurb, { color: color.textDim }]}>
          {count === 1
            ? 'The one question in this module that belongs to no patient.'
            : `${count} questions that belong to no patient — the scenarios with no bed, and the mechanism drills.`}
        </Text>
      </View>

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

      {waiting.length > 0 && (
        <View style={styles.elsewhere}>
          <Text style={[styles.elsewhereText, { color: color.textDim }]}>Also due at the bedside:</Text>
          {waiting.map((entry) => (
            <Pressable
              key={entry.bed.id}
              onPress={() => onGoBedside(entry.bed.id)}
              accessibilityRole="button"
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={[styles.bedLink, { color: accent }]}>
                {entry.bed.name} ({entry.due})
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: SPACE.lg },
  head: { gap: SPACE.xs },
  title: { fontSize: FONT.xl, fontWeight: '700' },
  blurb: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  elsewhere: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flexWrap: 'wrap',
  },
  elsewhereText: { fontSize: FONT.sm },
  bedLink: { fontSize: FONT.sm, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
