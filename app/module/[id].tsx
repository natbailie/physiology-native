import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiagramView } from '../../src/presentation/DiagramView';
import { ControlRailView } from '../../src/presentation/ControlRailView';
import { ReadoutGridView } from '../../src/presentation/ReadoutGridView';
import { TrendsView } from '../../src/presentation/TrendsView';
import { ScenarioBar } from '../../src/presentation/ScenarioBar';
import { PracticePanel } from '../../src/presentation/PracticePanel';
import { ExplainerView } from '../../src/presentation/ExplainerView';
import { TutorPanel } from '../../src/presentation/TutorPanel';
import { useProgressStore } from '../../src/shared/assessment/useProgressStore';
import { useNativeEngineLoop } from '../../src/hooks/useNativeEngineLoop';
import { adapterLoaders } from '../../src/engine/adapters.generated';
import type { AnyModuleAdapter, ModuleAdapter } from '../../src/engine/adapterTypes';
import { MODULES } from '../../src/home/moduleRegistry';
import { useEntitlement } from '../../src/billing/useEntitlement';
import { ReadoutStrip } from '../../src/presentation/ReadoutStrip';
import { SegmentedControl } from '../../src/presentation/SegmentedControl';
import {
  accentFrom,
  FONT,
  LINE,
  RADIUS,
  SPACE,
  TAP,
  useAppTheme,
  withAlpha,
} from '../../src/presentation/theme';

/**
 * The three things a learner does with a module, split rather than stacked.
 *
 * Everything used to be one ScrollView — scenario bar, diagram, readouts, trends, controls,
 * explainer, tutor and the whole question bank, in that order. On a phone that is several
 * screens of scrolling to reach the practice questions, and the explainer sat between the
 * controls and the questions for no reason other than the order the file was written in.
 */
const TABS = [
  { value: 'simulate' as const, label: 'Simulate' },
  { value: 'practice' as const, label: 'Practice' },
  { value: 'learn' as const, label: 'Learn' },
];

type ModuleTab = (typeof TABS)[number]['value'];

/** A pattern question has an `options` field; a prediction question has an intervention. */
function isPatternLike(q: any): boolean {
  return Boolean(q && 'options' in q);
}

/** Sits WITH the trends chart it controls rather than above the readouts, which is where it used
 *  to be — a control for a thing three screens further down. */
function BaselineBar({
  hasBaseline,
  onCapture,
  onClear,
  accent,
}: {
  hasBaseline: boolean;
  onCapture: () => void;
  onClear: () => void;
  accent: string;
}) {
  const { color } = useAppTheme();
  return (
    <View style={[styles.baselineBar, { backgroundColor: withAlpha(accent, 0.08) }]}>
      <Text style={[styles.baselineHint, { color: color.textDim }]}>
        {hasBaseline ? 'Baseline frozen — running trace overlays it' : 'Freeze this trace to compare scenarios'}
      </Text>
      <Pressable
        onPress={hasBaseline ? onClear : onCapture}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.baselineButton,
          { backgroundColor: accent },
          pressed && styles.optionPressed,
        ]}
      >
        <Text style={[styles.baselineButtonText, { color: color.onSolid }]}>
          {hasBaseline ? 'Clear baseline' : 'Set baseline'}
        </Text>
      </Pressable>
    </View>
  );
}

function EngineModuleScreen<TState, TInputs, TDerived, THistoryPoint>({
  moduleId,
  title,
  accent,
  adapter,
}: {
  /** The registry id, which is also the key progress is recorded under. */
  moduleId: string;
  /** Both from the file-synced registry, not from the adapter. */
  title: string;
  accent: string;
  adapter: ModuleAdapter<TState, TInputs, TDerived, THistoryPoint>;
}) {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ModuleTab>('simulate');

  const [inputs, setInputs] = useState<TInputs>(adapter.defaults);
   
  const loop = useNativeEngineLoop<TState, TInputs, TDerived, THistoryPoint>(inputs, adapter.config as any);
  const { snapshot, history, baseline, reset, perturb, fastForward } = loop;

  const handleChange = useMemo(
    () => <K extends keyof TInputs>(key: K, value: TInputs[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

   
  const presentation = useMemo(
    () =>
      adapter.build({
        state: snapshot.state,
        derived: snapshot.derived,
        inputs,
        history,
        baselineHistory: baseline.history,
         
      } as any),
    [snapshot, inputs, history, baseline.history, adapter],
  );

   
  const showCtx = useMemo(() => ({ state: snapshot.state, derived: snapshot.derived, inputs }) as any, [snapshot, inputs]);

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const applyPreset = useMemo(
    () => (id: string) => {
      const presetInputs: TInputs = {
        ...adapter.defaults,
         
        ...(adapter.presets[id] as any),
      } as TInputs;
      setInputs(presetInputs);
      setActivePreset(adapter.presetActiveKey(id));
      reset(presetInputs);
      const extra = adapter.settleOverrides?.[id];
      if (extra) fastForward(extra, presetInputs);
    },
    [adapter, reset, fastForward],
  );

  const actions = useMemo(() => adapter.actions(inputs, perturb), [adapter, inputs, perturb]);

  // "Run in simulator" for a prediction question: reset to its SETUP (settled), then apply the
  // intervention's inputs and one-off perturb so the loop plays the watched direction live.
  const runQuestion = useMemo(
    () => (questionId: string) => {
      const q = adapter.questions.find((x) => x?.id === questionId) as any;
      if (!q || isPatternLike(q)) return;
      const setupInputs: TInputs = {
        ...adapter.defaults,
        ...(q.setup?.preset ? adapter.presets[q.setup.preset] : {}),
        ...q.setup?.inputs,
      } as TInputs;
      setInputs(setupInputs);
      setActivePreset(q.setup?.preset ?? null);
      reset(setupInputs);
      if (q.setup?.perturb) perturb(q.setup.perturb as (s: TState) => TState);
      const interventionInputs: TInputs = {
        ...setupInputs,
        ...q.intervention?.inputs,
      } as TInputs;
      setInputs(interventionInputs);
      if (q.intervention?.perturb) perturb(q.intervention.perturb as (s: TState) => TState);
    },
    [adapter, reset, perturb],
  );

  // Withholds the readouts that would name the answer while a pattern question is unanswered.
  const [blinded, setBlinded] = useState(false);

  // The same store the web uses: on-device until a learner signs in, the server after.
  const store = useProgressStore();
  const recordOutcome = useCallback(
    (questionId: string, correct: boolean) => store.record(moduleId, questionId, correct),
    [store, moduleId],
  );

  return (
    <View style={[styles.container, { backgroundColor: color.bg }]}>
      {/* Without this the stack header reads the route pattern, "module/[id]". The module name
          lives there rather than in the page body, which is where a native app expects it. */}
      <Stack.Screen options={{ title: title }} />

      {/* Both of these sit OUTSIDE the ScrollView, which is the point of them. The web is a
          two-column desktop layout with the control rail beside the readouts; here the rail is
          under them, so without a pinned copy of the headline numbers a learner dragging a slider
          cannot see the thing the slider moves. That is the whole proposition of the product. */}
      <View style={[styles.tabBar, { backgroundColor: color.panel, borderBottomColor: color.panelBorder }]}>
        <SegmentedControl segments={TABS} value={tab} onChange={setTab} accent={accent} />
      </View>
      {tab === 'simulate' && (
        <ReadoutStrip readouts={presentation.readouts} ctx={showCtx} blinded={blinded} />
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}>
        {tab === 'simulate' && (
          <>
            <ScenarioBar
              presets={adapter.order.map((id) => ({ id, label: adapter.labels[id] }))}
              activePreset={activePreset}
              onApplyPreset={applyPreset}
              actions={actions}
              accent={accent}
            />
            {presentation.diagram.map((frame, i) => (
              <DiagramView
                key={frame.key ?? i}
                frame={frame}
                blinded={blinded}
                classes={adapter.diagramClasses}
              />
            ))}
            <ReadoutGridView readouts={presentation.readouts} ctx={showCtx} blinded={blinded} />
            {/* Directly under the readouts, and above the trends — the trends chart is tall, and
                putting it between the numbers and the controls is what buried the rail. */}
            <ControlRailView
              controls={presentation.controls}
              inputs={inputs}
              onChange={handleChange}
              accent={accent}
            />
            {presentation.charts.length > 0 && (
              <>
                <BaselineBar
                  hasBaseline={baseline.history !== null}
                  onCapture={baseline.capture}
                  onClear={baseline.clear}
                  accent={accent}
                />
                <TrendsView
                  charts={presentation.charts}
                  history={history}
                  baselineHistory={baseline.history}
                   
                  derived={snapshot.derived as any}
                />
              </>
            )}
          </>
        )}

        {tab === 'practice' && (
          <PracticePanel
             
            config={adapter.config as any}
             
            defaults={adapter.defaults as any}
             
            presets={adapter.presets as any}
             
            questions={adapter.questions as any}
            title={title}
            accent={accent}
            onOpenScenario={applyPreset}
            onRunQuestion={(questionId) => {
              runQuestion(questionId);
              // "Run in simulator" has to actually show the simulator, which it could not do
              // while everything was one scroll and the question was below the diagram.
              setTab('simulate');
            }}
            onBlindedChange={setBlinded}
            onRecord={recordOutcome}
          />
        )}

        {tab === 'learn' && (
          <>
            <ExplainerView
              content={adapter.content}
              accent={accent}
              onOpenScenario={(id) => {
                applyPreset(id);
                setTab('simulate');
              }}
              presetLabels={adapter.labels}
            />
            <TutorPanel moduleId={moduleId} accent={accent} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Resolves the route id to a module and loads its adapter on demand.
 *
 * The adapter arrives through `adapters.generated.ts` rather than a static import, so opening one
 * module bundles one module. Title and accent come from the file-synced registry, which is the
 * catalogue's single source of truth — an adapter states neither.
 */
export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scheme, color } = useAppTheme();

  const moduleId = id ?? '';
  const descriptor = MODULES.find((m) => m.id === moduleId);
  const loader = adapterLoaders[moduleId];

  /**
   * Keyed by module id rather than held bare, for two reasons: navigating straight from one
   * module to another must not render the previous module's adapter against this one's registry
   * entry, and clearing it in the effect would be a setState during render's commit — which is
   * what `react-hooks/set-state-in-effect` is there to catch.
   */
  const entitlement = useEntitlement();

  const [loaded, setLoaded] = useState<{ id: string; adapter: AnyModuleAdapter } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!loader) return;
    let live = true;
    loader()
      .then((mod) => {
        if (live) setLoaded({ id: moduleId, adapter: mod.adapter });
      })
      .catch(() => {
        if (live) setFailed(moduleId);
      });
    return () => {
      live = false;
    };
  }, [loader, moduleId]);

  const adapter = loaded?.id === moduleId ? loaded.adapter : null;

  if (!loader || !descriptor) {
    return (
      <View style={[styles.center, { backgroundColor: color.bg }]}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={[styles.errorText, { color: color.text }]}>Module not found</Text>
      </View>
    );
  }

  /**
   * Resolved before the guards below, all of which use it. `accentColorVar` is a CSS reference —
   * `var(--artery)` — and a handful of registry entries carry none, so the muted text grey is the
   * fallback.
   */
  const accent = accentFrom(descriptor.accentColorVar, scheme, color.textDim);

  /**
   * The paywall. Three systems are free and the rest need full access, which is what the web
   * gates on — this app shipped all 45 free, which was simply a leak.
   *
   * `useEntitlement` reads the state from Supabase, so an institutional seat or a subscription
   * bought on the web both unlock here with no purchase code in this app at all.
   */
  if (entitlement.status !== 'loading' && !entitlement.isUnlocked(moduleId)) {
    return (
      <View style={[styles.center, styles.locked, { backgroundColor: color.bg }]}>
        <Stack.Screen options={{ title: descriptor.name }} />
        <Text style={[styles.lockedTitle, { color: color.text }]}>{descriptor.name}</Text>
        <Text style={[styles.errorText, { color: color.textDim }]}>
          This simulator is part of full access.
        </Text>
        {/* The styling sits on an inner View, not on the Pressable: `Link asChild` forwards its
            own props onto the child, and its undefined `style` clobbers one set here. Same shape
            as the cards on the home screen. */}
        <Link href="/pricing" asChild>
          <Pressable>
            {({ pressed }) => (
              <View style={[styles.lockedButton, { backgroundColor: accent }, pressed && styles.optionPressed]}>
                <Text style={[styles.lockedButtonText, { color: color.onSolid }]}>See full access</Text>
              </View>
            )}
          </Pressable>
        </Link>
      </View>
    );
  }

  if (failed === moduleId) {
    return (
      <View style={[styles.center, { backgroundColor: color.bg }]}>
        <Stack.Screen options={{ title: descriptor.name }} />
        <Text style={[styles.errorText, { color: color.text }]}>
          {descriptor.name} could not be loaded
        </Text>
      </View>
    );
  }

  if (!adapter) {
    return (
      <View style={[styles.center, { backgroundColor: color.bg }]}>
        <Stack.Screen options={{ title: descriptor.name }} />
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  return (
    <EngineModuleScreen
      moduleId={moduleId}
      title={descriptor.name}
      accent={accent}
      adapter={adapter}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.xl, gap: SPACE.xl },
  tabBar: { paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md, borderBottomWidth: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: FONT.base, textAlign: 'center' },
  locked: { padding: SPACE.xxxl, gap: SPACE.lg },
  lockedTitle: { fontSize: FONT.xl, fontWeight: '700', textAlign: 'center' },
  lockedButton: {
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxl,
    marginTop: SPACE.xs,
  },
  lockedButtonText: { fontSize: FONT.base, fontWeight: '700' },
  baselineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.sm,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  baselineHint: { fontSize: FONT.micro, lineHeight: FONT.micro * LINE.snug, flexShrink: 1 },
  baselineButton: {
    borderRadius: RADIUS.sm,
    minHeight: TAP - 8,
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
  },
  baselineButtonText: { fontSize: FONT.xs, fontWeight: '700' },
  optionPressed: { opacity: 0.6 },
});
