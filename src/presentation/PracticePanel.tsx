import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
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

function PracticeRowUncommitted({
  question,
  accent,
  onCommit,
}: {
  question: PredictQuestion<any, any, any>;
  accent: string;
  onCommit: (answerId: string) => void;
}) {
  return (
    <View>
      <Text style={styles.stem}>{question.stem}</Text>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {DIRECTION_CHOICES.map((choice) => (
        <Pressable
          key={choice.id}
          onPress={() => onCommit(choice.id)}
          style={({ pressed }) => [
            styles.optionButton,
            pressed && styles.optionPressed,
            { borderLeftColor: accent },
          ]}
        >
          <Text style={styles.optionText}>{choice.label}</Text>
        </Pressable>
      ))}
    </View>
  );
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
  const isDark = useColorScheme() === 'dark';

  const answer = correctAnswerOf(question);

  const handleCommit = (answerId: string) => {
    if (phase === 'committed') return;
    setPicked(answerId);
    setPhase('committed');
    onRecord?.(question.id, answerId === answer);
  };

  const correct = picked === answer;

  const openTarget = question.setup?.preset as string | undefined;

  const runAction = onRunQuestion ? () => onRunQuestion(question.id) : onOpenScenario && openTarget ? () => onOpenScenario(openTarget) : null;

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      {phase === 'idle' ? (
        <PracticeRowUncommitted question={question} accent={accent} onCommit={handleCommit} />
      ) : (
        <View style={styles.reveal}>
          <Text style={styles.stem}>{question.stem}</Text>
          <Text style={[styles.verdict, { color: correct ? '#059669' : '#dc2626' }]}>
            {correct ? 'Correct' : 'Not quite'}
          </Text>
          {outcome ? (
            <Text style={[styles.outcomeLine, isDark && styles.textDim]}>
              {question.watch}: {format(outcome.before, outcome.decimals)} →{' '}
              {format(outcome.after, outcome.decimals)} ({outcome.observed})
            </Text>
          ) : null}
          <Text style={styles.explanation}>{question.explanation}</Text>
          <View style={styles.revealActions}>
            {runAction ? (
              <Pressable
                onPress={runAction}
                style={({ pressed }) => [styles.simButton, { borderColor: accent }, pressed && styles.optionPressed]}
              >
                <Text style={[styles.simButtonText, { color: accent }]}>Run in simulator</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                setPhase('idle');
                setPicked(null);
              }}
              style={({ pressed }) => [styles.retryButton, pressed && styles.optionPressed]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
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
  const isDark = useColorScheme() === 'dark';

  const [committed, setCommitted] = useState<ReadonlySet<string>>(() => new Set());
  const commit = useCallback((questionId: string) => {
    setCommitted((prev) => (prev.has(questionId) ? prev : new Set(prev).add(questionId)));
  }, []);

  const blinded = questions.some((q) => isPatternQuestion(q) && !committed.has(q.id));
  useEffect(() => {
    onBlindedChange?.(blinded);
  }, [blinded, onBlindedChange]);

  const outcomes = useMemo(() => {
    const map = new Map<string, PredictOutcome | null>();
    for (const q of questions) {
      if (isPatternQuestion(q)) {
        map.set(q.id, null);
      } else {
        const res = runQuestion(config, defaults, presets, q as never);
        const decimals = 2;
        map.set(q.id, {
          before: res.before,
          after: res.after,
          observed: res.observed,
          matches: res.matches,
          decimals,
        } satisfies PredictOutcome);
      }
    }
    return map;
  }, [config, defaults, presets, questions]);

  // Precomputed pattern panels (settled once, all options).
  const patternPanels = useMemo(() => {
    const map = new Map<string, ReturnType<typeof readPanel> | null>();
    for (const q of questions) {
      if (!isPatternQuestion(q)) continue;
      const res = runPatternQuestion(config, defaults, presets, q as never);
      map.set(q.id, res.panels.get((q as { answer: string }).answer) ?? null);
    }
    return map;
  }, [config, defaults, presets, questions]);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Practice</Text>
      <Text style={[styles.sectionHint, isDark && styles.textDim]}>
        Answer against the model. Become automated.
      </Text>
      {questions.map((q) => {
        if (isPatternQuestion(q)) {
          return (
            <PatternPracticeRow
              key={q.id}
              question={q as never}
              panel={patternPanels.get(q.id) ?? null}
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
            outcome={outcomes.get(q.id) ?? null}
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
  const isDark = useColorScheme() === 'dark';

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
    onCommit(question.id);
    onRecord?.(question.id, ans === styled.answer);
  };

  const correct = picked === styled.answer;

  if (phase === 'idle') {
    return (
      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={styles.stem}>{question.stem}</Text>
        {orderedOptions(question.id, styled.options).map((opt) => (
          <Pressable
            key={opt}
            onPress={() => handleCommit(opt)}
            style={({ pressed }) => [styles.optionButton, pressed && styles.optionPressed]}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Text style={[styles.verdict, { color: correct ? '#059669' : '#dc2626' }]}>
        {correct ? 'Correct' : 'Not quite'}
      </Text>
      {panel && styled.panel ? (
        <View style={styles.panel}>
          {panel.map((row, i) => {
            const field = styled.panel?.[i];
            const decimals = field?.decimals ?? 2;
            return (
              <View key={row.label} style={[styles.panelRow, isDark && styles.panelRowDark]}>
                <Text style={[styles.panelLabel, isDark && styles.textDim]}>{row.label}</Text>
                <Text style={[styles.panelValue, isDark && styles.textLight]}>
                  {row.value.toFixed(decimals)}
                  {field?.unit ? ` ${field.unit}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
      <Text style={styles.explanation}>{styled.explanation}</Text>
      <View style={styles.revealActions}>
        {onOpenScenario ? (
          <Pressable
            onPress={() => onOpenScenario(styled.answer)}
            style={({ pressed }) => [styles.simButton, { borderColor: accent }, pressed && styles.optionPressed]}
          >
            <Text style={[styles.simButtonText, { color: accent }]}>Run in simulator</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            setPhase('idle');
            setPicked(null);
          }}
          style={({ pressed }) => [styles.retryButton, pressed && styles.optionPressed]}
        >
          <Text style={styles.retryButtonText}>Review labs</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  sectionHint: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  cardDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  stem: { fontSize: 14, lineHeight: 20, color: '#0f172a' },
  prompt: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginTop: 4 },
  optionButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  optionPressed: { opacity: 0.6 },
  optionText: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  verdict: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  outcomeLine: { fontSize: 13, color: '#475569', fontFamily: 'monospace' },
  textDim: { color: '#94a3b8' },
  textLight: { color: '#e2e8f0' },
  explanation: { fontSize: 13, lineHeight: 19, color: '#475569', marginTop: 4 },
  reveal: { gap: 6 },
  revealActions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  simButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  simButtonText: { fontSize: 14, fontWeight: '600' },
  retryButton: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  retryButtonText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  panel: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  panelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  panelRowDark: { backgroundColor: '#0f172a' },
  panelLabel: { fontSize: 13, color: '#475569' },
  panelValue: { fontSize: 13, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' },
});
