import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  DIRECTION_CHOICES,
  correctAnswerOf,
  orderedOptions,
  type ModuleQuestion,
  type PredictQuestion,
} from '../shared/assessment/types';
import type { readPanel } from '../shared/assessment/verifyPattern';
import type { PredictOutcome } from './useSettledQuestions';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { answerFeedback } from './haptics';

export interface CommittedAnswer {
  picked: string;
  correct: boolean;
}

function format(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/**
 * One answer, before or after the commit.
 *
 * The options used to be replaced entirely by the verdict, so the moment a learner answered they
 * lost sight of what they had picked — and on a wrong answer the explanation then referred to a
 * choice no longer on screen. They stay now, with the picked one and the right one both marked,
 * which is the shape every question bank uses and the reason it does.
 */
function OptionRow({
  label,
  gloss,
  onPress,
  state,
}: {
  label: string;
  /**
   * One line saying what this scenario IS — never what its numbers do.
   *
   * It is the same string the web prints under a choice, and it is here for the same reason: a
   * preset label alone ("Obstructive") is a word a learner either knows or does not, and the
   * gloss is what makes the option answerable from the panel above rather than from vocabulary.
   * `glossSuite.ts` in the web project holds it to naming no panel row and quoting no figure —
   * which is what stops it becoming the answer instead.
   */
  gloss?: string;
  onPress?: () => void;
  /** `idle` before the commit; afterwards, what this particular option turned out to be. */
  state: 'idle' | 'neutral' | 'correct' | 'wrong';
}) {
  const { color } = useAppTheme();

  const tint =
    state === 'correct' ? color.ok : state === 'wrong' ? color.danger : undefined;

  // The gloss is part of what the option SAYS, so it belongs in the accessible name rather than
  // being left as a second unlabelled text node a screen reader reaches separately.
  const name = gloss ? `${label} — ${gloss}` : label;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={
        state === 'correct'
          ? `${name} — correct answer`
          : state === 'wrong'
            ? `${name} — your answer, wrong`
            : name
      }
      style={({ pressed }) => [
        styles.optionButton,
        {
          backgroundColor: tint ? withAlpha(tint, 0.1) : color.panelRaised,
          borderColor: tint ?? color.panelBorder,
        },
        state === 'neutral' && styles.optionFaded,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={styles.optionCopy}>
        <Text style={[styles.optionText, { color: tint ?? color.text }]}>{label}</Text>
        {gloss ? <Text style={[styles.optionGloss, { color: color.textDim }]}>{gloss}</Text> : null}
      </View>
      {state === 'correct' && <Text style={[styles.optionMark, { color: color.ok }]}>✓</Text>}
      {state === 'wrong' && <Text style={[styles.optionMark, { color: color.danger }]}>✕</Text>}
    </Pressable>
  );
}

/** What one option should look like once an answer is in. */
function optionState(
  optionId: string,
  picked: string | null,
  answer: string,
): 'neutral' | 'correct' | 'wrong' {
  if (optionId === answer) return 'correct';
  if (optionId === picked) return 'wrong';
  return 'neutral';
}

type Phase = 'idle' | 'committed';

export interface PredictRowProps {
  /** This row's entry in the screen's committed map — restores the verdict after a remount. */
  committed?: CommittedAnswer | null;
  onCommit: (questionId: string, picked: string, correct: boolean) => void;
  question: PredictQuestion<any, any, any>;
  outcome: PredictOutcome | null;
  accent: string;
  onOpenScenario?: (presetId: string) => void;
  onRunQuestion?: (questionId: string) => void;
}

export function PredictRow({
  question,
  outcome,
  accent,
  committed: entry,
  onCommit,
  onOpenScenario,
  onRunQuestion,
}: PredictRowProps) {
  const [phase, setPhase] = useState<Phase>(entry ? 'committed' : 'idle');
  const [picked, setPicked] = useState<string | null>(entry?.picked ?? null);
  const { color } = useAppTheme();

  const answer = correctAnswerOf(question);

  const handleCommit = (answerId: string) => {
    if (phase === 'committed') return;
    setPicked(answerId);
    setPhase('committed');
    // After a few questions the hand knows the result before the eye reads it.
    answerFeedback(answerId === answer);
    onCommit(question.id, answerId, answerId === answer);
  };

  const correct = picked === answer;

  const openTarget = question.setup?.preset as string | undefined;

  const runAction = onRunQuestion ? () => onRunQuestion(question.id) : onOpenScenario && openTarget ? () => onOpenScenario(openTarget) : null;

  const committed = phase === 'committed';

  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Text style={[styles.stem, { color: color.text }]}>{question.stem}</Text>
      <Text style={[styles.prompt, { color: color.text }]}>{question.prompt}</Text>

      {/*
        The live value before the commit. The web reads it off the running engine; this tab has
        no live loop, so the setup-settled metric stands in — the number the prediction is
        judged against, not the movement, which the dashed trace used to carry.
      */}
      {!committed && outcome ? (
        <View style={[styles.panel, { borderColor: color.panelBorder }]}>
          <View style={[styles.panelRow, { backgroundColor: color.panelRaised }]}>
            <Text style={[styles.panelLabel, { color: color.textDim }]}>{question.watch}</Text>
            <Text style={[styles.panelValue, { color: color.text }]}>
              {format(outcome.before, outcome.decimals)}
            </Text>
          </View>
        </View>
      ) : null}

      {DIRECTION_CHOICES.map((choice) => (
        <OptionRow
          key={choice.id}
          label={choice.label}
          onPress={committed ? undefined : () => handleCommit(choice.id)}
          state={committed ? optionState(choice.id, picked, answer) : 'idle'}
        />
      ))}

      {committed && (
        <View style={styles.reveal}>
          <Text style={[styles.verdict, { color: correct ? color.ok : color.danger }]}>
            {correct ? 'Correct' : 'Not quite'}
          </Text>
          {outcome ? (
            <Text style={[styles.outcomeLine, { color: color.textDim }]}>
              {question.watch}: {format(outcome.before, outcome.decimals)} →{' '}
              {format(outcome.after, outcome.decimals)} ({outcome.observed})
            </Text>
          ) : null}
          <Text style={[styles.explanation, { color: color.textDim }]}>{question.explanation}</Text>
          <View style={styles.revealActions}>
            {runAction ? (
              <Pressable
                onPress={runAction}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.simButton,
                  { borderColor: accent, backgroundColor: withAlpha(accent, 0.1) },
                  pressed && styles.optionPressed,
                ]}
              >
                <Text style={[styles.simButtonText, { color: accent }]}>Run in simulator</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                setPhase('idle');
                setPicked(null);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: color.panelRaised, borderColor: color.panelBorder },
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.retryButtonText, { color: color.textDim }]}>Try again</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export interface PatternRowProps {
  /** This row's entry in the screen's committed map — restores the verdict after a remount. */
  committed?: CommittedAnswer | null;
  /** Reports the answer; the caller records it once and unblinds when the pool allows. */
  onCommit: (questionId: string, picked: string, correct: boolean) => void;
  /** Display names for the scenario options — raw preset ids answer nothing. */
  presetLabels?: Record<string, string>;
  /** One line per scenario saying what it is; see `OptionRow`. Sparse by design. */
  presetGloss?: Record<string, string>;
  question: ModuleQuestion<any, any, any>;
  panel: ReturnType<typeof readPanel> | null;
  accent: string;
  onOpenScenario?: (presetId: string) => void;
}

export function PatternRow({
  question,
  panel,
  accent,
  presetLabels,
  presetGloss,
  committed: entry,
  onOpenScenario,
  onCommit,
}: PatternRowProps) {
  const [phase, setPhase] = useState<'idle' | 'committed'>(entry ? 'committed' : 'idle');
  const [picked, setPicked] = useState<string | null>(entry?.picked ?? null);
  const { color } = useAppTheme();

  const styled = question as {
    answer: string;
    options: readonly string[];
    panel?: readonly { label: string; unit?: string; decimals?: number }[];
    explanation: string;
    settleSeconds?: number;
  };

  // The panel renders BEFORE the commit — it is the instrument the question is answered
  // from, the same rows the fairness check marks against. Only the verdict, the explanation
  // and the actions wait for an answer.
  const handleCommit = (ans: string) => {
    if (phase === 'committed') return;
    setPicked(ans);
    setPhase('committed');
    answerFeedback(ans === styled.answer);
    onCommit(question.id, ans, ans === styled.answer);
  };

  const correct = picked === styled.answer;
  const committed = phase === 'committed';

  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Text style={[styles.stem, { color: color.text }]}>{question.stem}</Text>

      {/* ABOVE the options, not below them, which is where this used to sit.
          This panel IS the evidence the question is answered from — the same rows the fairness
          check marks the options against — and on a phone a row of tappable options above it
          invites a commit before the learner has scrolled to the numbers at all. The web puts
          the instrument first for the same reason. */}
      {panel && styled.panel ? (
        <View style={[styles.panel, { borderColor: color.panelBorder }]}>
          {panel.map((row, i) => {
            const field = styled.panel?.[i];
            const decimals = field?.decimals ?? 2;
            return (
              <View key={row.label} style={[styles.panelRow, { backgroundColor: color.panelRaised }]}>
                <Text style={[styles.panelLabel, { color: color.textDim }]}>{row.label}</Text>
                <Text style={[styles.panelValue, { color: color.text }]}>
                  {row.value.toFixed(decimals)}
                  {field?.unit ? ` ${field.unit}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {orderedOptions(question.id, styled.options).map((opt) => (
        <OptionRow
          key={opt}
          label={presetLabels?.[opt] ?? opt}
          gloss={presetGloss?.[opt]}
          onPress={committed ? undefined : () => handleCommit(opt)}
          state={committed ? optionState(opt, picked, styled.answer) : 'idle'}
        />
      ))}

      {!committed ? null : (
      <>
      <Text style={[styles.verdict, { color: correct ? color.ok : color.danger }]}>
        {correct ? 'Correct' : 'Not quite'}
      </Text>
      <Text style={[styles.explanation, { color: color.textDim }]}>{styled.explanation}</Text>
      <View style={styles.revealActions}>
        {onOpenScenario ? (
          <Pressable
            onPress={() => onOpenScenario(styled.answer)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.simButton,
              { borderColor: accent, backgroundColor: withAlpha(accent, 0.1) },
              pressed && styles.optionPressed,
            ]}
          >
            <Text style={[styles.simButtonText, { color: accent }]}>Run in simulator</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            setPhase('idle');
            setPicked(null);
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: color.panelRaised, borderColor: color.panelBorder },
            pressed && styles.optionPressed,
          ]}
        >
          <Text style={[styles.retryButtonText, { color: color.textDim }]}>Review labs</Text>
        </Pressable>
      </View>
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    padding: SPACE.xl,
    borderWidth: 1,
    gap: SPACE.md,
  },
  stem: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  prompt: { fontSize: FONT.sm, fontWeight: '700' },
  // Full-width rows at the iOS minimum height. These were 10pt of vertical padding round 14pt
  // text — about 36pt, and the row grew or shrank with the length of the label.
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    minHeight: TAP,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  optionPressed: { opacity: 0.6 },
  // The options a learner neither picked nor should have: still legible, visibly not the answer.
  optionFaded: { opacity: 0.55 },
  // Label and gloss are one column so the ✓/✕ stays on the row's centre line however many
  // lines the gloss wraps to.
  optionCopy: { flexShrink: 1, gap: SPACE.xs },
  optionText: { fontSize: FONT.sm, fontWeight: '600' },
  optionGloss: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  optionMark: { fontSize: FONT.base, fontWeight: '700' },
  verdict: { fontSize: FONT.base, fontWeight: '700', marginTop: SPACE.xs },
  outcomeLine: { fontSize: FONT.xs, fontVariant: ['tabular-nums'] },
  explanation: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  reveal: { gap: SPACE.sm },
  revealActions: { flexDirection: 'row', gap: SPACE.md, marginTop: SPACE.md, flexWrap: 'wrap' },
  simButton: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  simButtonText: { fontSize: FONT.sm, fontWeight: '700' },
  retryButton: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  retryButtonText: { fontSize: FONT.sm, fontWeight: '600' },
  panel: { borderRadius: RADIUS.sm, overflow: 'hidden', borderWidth: 1 },
  panelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  panelLabel: { fontSize: FONT.xs },
  panelValue: { fontSize: FONT.xs, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
