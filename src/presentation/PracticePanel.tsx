import { useCallback, useEffect, useState } from 'react';
import { InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeLoopConfig } from '../hooks/useNativeEngineLoop';
import {
  DIRECTION_CHOICES,
  correctAnswerOf,
  isPatternQuestion,
  orderedOptions,
  type ModuleQuestion,
  type PredictQuestion,
  type Direction,
} from '../shared/assessment/types';
import { runQuestion } from '../shared/assessment/verifyQuestion';
import { readPanel, runPatternQuestion } from '../shared/assessment/verifyPattern';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { answerFeedback } from './haptics';

/* ------------------------------------------------------------------ */
/*  Engine-backed truth: settle each question once and keep it         */
/* ------------------------------------------------------------------ */

interface PredictOutcome {
  before: number;
  after: number;
  observed: Direction;
  matches: boolean;
  decimals: number;
}

function format(value: number, decimals: number): string {
  const rounded = value.toFixed(decimals);
  return rounded;
}

/* ------------------------------------------------------------------ */
/*  Practice panel                                                     */
/* ------------------------------------------------------------------ */

export interface PracticePanelProps {
  title: string;
  accent: string;
   
  config: NativeLoopConfig<any, any, any, any>;
   
  defaults: any;
   
  presets: Record<string, any>;
   
  questions: readonly ModuleQuestion<any, any, any>[];
  /** Load a named preset into the live simulator. */
  onOpenScenario?: (presetId: string) => void;
  /** Apply a prediction question's SETUP then INTERVENTION to the live simulator so the
   *  learner can watch the watched quantity play out. */
  onRunQuestion?: (questionId: string) => void;
  /** Reports whether any pattern-discrimination question is still unanswered, so the readout
   *  grid can withhold the tiles that would name the answer. */
  onBlindedChange?: (blinded: boolean) => void;
  /** Records an outcome against the learner's progress. Called once per question, on the first
   *  commit — a revealed question cannot be re-answered, so there is no second attempt to log. */
  onRecord?: (questionId: string, correct: boolean) => void;
}

type Phase = 'idle' | 'committed';

interface PracticeRowProps {
  onRecord?: (questionId: string, correct: boolean) => void;
  question: PredictQuestion<any, any, any>;
  outcome: PredictOutcome | null;
  accent: string;
  onOpenScenario?: (presetId: string) => void;
  onRunQuestion?: (questionId: string) => void;
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
  onPress,
  state,
}: {
  label: string;
  onPress?: () => void;
  /** `idle` before the commit; afterwards, what this particular option turned out to be. */
  state: 'idle' | 'neutral' | 'correct' | 'wrong';
}) {
  const { color } = useAppTheme();

  const tint =
    state === 'correct' ? color.ok : state === 'wrong' ? color.danger : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={
        state === 'correct' ? `${label} — correct answer` : state === 'wrong' ? `${label} — your answer, wrong` : label
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
      <Text style={[styles.optionText, { color: tint ?? color.text }]}>{label}</Text>
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

function PracticeRow({
  question,
  outcome,
  accent,
  onOpenScenario,
  onRunQuestion,
  onRecord,
}: PracticeRowProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<string | null>(null);
  const { color } = useAppTheme();

  const answer = correctAnswerOf(question);

  const handleCommit = (answerId: string) => {
    if (phase === 'committed') return;
    setPicked(answerId);
    setPhase('committed');
    // After a few questions the hand knows the result before the eye reads it.
    answerFeedback(answerId === answer);
    onRecord?.(question.id, answerId === answer);
  };

  const correct = picked === answer;

  const openTarget = question.setup?.preset as string | undefined;

  const runAction = onRunQuestion ? () => onRunQuestion(question.id) : onOpenScenario && openTarget ? () => onOpenScenario(openTarget) : null;

  const committed = phase === 'committed';

  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Text style={[styles.stem, { color: color.text }]}>{question.stem}</Text>
      <Text style={[styles.prompt, { color: color.text }]}>{question.prompt}</Text>

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

export function PracticePanel({
  title,
  accent,
  config,
  defaults,
  presets,
  questions,
  onOpenScenario,
  onRunQuestion,
  onBlindedChange,
  onRecord,
}: PracticePanelProps) {
  const { color } = useAppTheme();

  const [committed, setCommitted] = useState<ReadonlySet<string>>(() => new Set());
  const commit = useCallback((questionId: string) => {
    setCommitted((prev) => (prev.has(questionId) ? prev : new Set(prev).add(questionId)));
  }, []);

  const blinded = questions.some((q) => isPatternQuestion(q) && !committed.has(q.id));
  useEffect(() => {
    onBlindedChange?.(blinded);
  }, [blinded, onBlindedChange]);

  /**
   * Settling every question against the engine, off the render path.
   *
   * This is not cheap: a module carries up to sixteen questions, each settled twice — before and
   * after its intervention — at `settleSeconds / maxDtSeconds` steps a time. Glucose alone is
   * 3600s at 0.25s, so 14,400 steps per settle. Doing that inside a `useMemo` ran the whole lot
   * synchronously during render, freezing the JS thread before the screen had drawn once.
   *
   * It runs after the navigation animation instead, and the rows render without it: a prediction
   * row needs its outcome only once revealed, and a pattern row needs its panel only once
   * committed, so both are null-tolerant by construction.
   */
  const [settled, setSettled] = useState<{
    outcomes: Map<string, PredictOutcome | null>;
    patternPanels: Map<string, ReturnType<typeof readPanel> | null>;
  } | null>(null);

  useEffect(() => {
    let live = true;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!live) return;
      const outcomes = new Map<string, PredictOutcome | null>();
      const patternPanels = new Map<string, ReturnType<typeof readPanel> | null>();
      for (const q of questions) {
        if (isPatternQuestion(q)) {
          outcomes.set(q.id, null);
          const res = runPatternQuestion(config, defaults, presets, q as never);
          patternPanels.set(q.id, res.panels.get((q as { answer: string }).answer) ?? null);
        } else {
          const res = runQuestion(config, defaults, presets, q as never);
          outcomes.set(q.id, {
            before: res.before,
            after: res.after,
            observed: res.observed,
            matches: res.matches,
            decimals: 2,
          } satisfies PredictOutcome);
        }
      }
      if (live) setSettled({ outcomes, patternPanels });
    });
    return () => {
      live = false;
      task.cancel();
    };
  }, [config, defaults, presets, questions]);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: color.text }]}>Practice</Text>
      <Text style={[styles.sectionHint, { color: color.textDim }]}>
        Answer against the model. Become automated.
      </Text>
      {questions.map((q) => {
        if (isPatternQuestion(q)) {
          return (
            <PatternPracticeRow
              key={q.id}
              question={q as never}
              panel={settled?.patternPanels.get(q.id) ?? null}
              accent={accent}
              onOpenScenario={onOpenScenario}
              onCommit={commit}
              onRecord={onRecord}
            />
          );
        }
        return (
          <PracticeRow
            key={q.id}
             
            question={q as any}
            outcome={settled?.outcomes.get(q.id) ?? null}
            accent={accent}
            onOpenScenario={onOpenScenario}
            onRunQuestion={onRunQuestion}
            onRecord={onRecord}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Pattern question row (shows the lab panel once committed)          */
/* ------------------------------------------------------------------ */

interface PatternRowProps {
  /** Called once, when the learner commits an answer, so the panel can stop blinding. */
  onCommit: (questionId: string) => void;
  onRecord?: (questionId: string, correct: boolean) => void;
   
  question: ModuleQuestion<any, any, any>;
  panel: ReturnType<typeof readPanel> | null;
  accent: string;
  onOpenScenario?: (presetId: string) => void;
}

function PatternPracticeRow({ question, panel, accent, onOpenScenario, onCommit, onRecord }: PatternRowProps) {
  const [phase, setPhase] = useState<'idle' | 'committed'>('idle');
  const [picked, setPicked] = useState<string | null>(null);
  const { color } = useAppTheme();

  const styled = question as {
    answer: string;
    options: readonly string[];
    panel?: readonly { label: string; unit?: string; decimals?: number }[];
    explanation: string;
    settleSeconds?: number;
  };

  // Only render the panel after commit — the stem may describe the labs.
  const handleCommit = (ans: string) => {
    if (phase === 'committed') return;
    setPicked(ans);
    setPhase('committed');
    answerFeedback(ans === styled.answer);
    onCommit(question.id);
    onRecord?.(question.id, ans === styled.answer);
  };

  const correct = picked === styled.answer;
  const committed = phase === 'committed';

  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Text style={[styles.stem, { color: color.text }]}>{question.stem}</Text>

      {orderedOptions(question.id, styled.options).map((opt) => (
        <OptionRow
          key={opt}
          label={opt}
          onPress={committed ? undefined : () => handleCommit(opt)}
          state={committed ? optionState(opt, picked, styled.answer) : 'idle'}
        />
      ))}

      {!committed ? null : (
      <>
      <Text style={[styles.verdict, { color: correct ? color.ok : color.danger }]}>
        {correct ? 'Correct' : 'Not quite'}
      </Text>
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
  section: { gap: SPACE.lg },
  sectionTitle: { fontSize: FONT.xl, fontWeight: '700' },
  sectionHint: { fontSize: FONT.xs, marginBottom: SPACE.xs },
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
  optionText: { fontSize: FONT.sm, fontWeight: '600', flexShrink: 1 },
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
