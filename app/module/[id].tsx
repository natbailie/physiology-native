import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiagramView } from '../../src/presentation/DiagramView';
import { ControlDock } from '../../src/presentation/ControlDock';
import { ToggleGroup } from '../../src/presentation/ControlRailView';
import { lookupColor } from '../../src/presentation/palette';
import { ReadoutGridView } from '../../src/presentation/ReadoutGridView';
import { TrendsView } from '../../src/presentation/TrendsView';
import { ScenarioBar } from '../../src/presentation/ScenarioBar';
import { CaseHeader } from '../../src/presentation/CaseHeader';
import { ClinicPanel } from '../../src/presentation/ClinicPanel';
import { QuestionSet } from '../../src/presentation/QuestionSet';
import { TabFade } from '../../src/presentation/TabFade';
import { clampTab, tabsForModule, type ModuleTab } from '../../src/presentation/moduleTabs';
import type { CommittedAnswer } from '../../src/presentation/QuestionRows';
import { unclaimedQuestions } from '../../src/shared/cases/unclaimed';
import type { ModuleCase } from '../../src/shared/cases/types';
import { loadModuleCases } from '../../src/engine/loadModuleCases';
import { isPatternQuestion } from '../../src/shared/assessment/types';
import { ExplainerView } from '../../src/presentation/ExplainerView';
import { TutorPanel } from '../../src/presentation/TutorPanel';
import { useProgressStore } from '../../src/shared/assessment/useProgressStore';
import { useInputNudge } from '../../src/hooks/useInputNudge';
import { useNativeEngineLoop } from '../../src/hooks/useNativeEngineLoop';
import { adapterLoaders } from '../../src/engine/adapters.generated';
import type { AnyModuleAdapter, ModuleAdapter } from '../../src/engine/adapterTypes';
import { MODULES } from '../../src/home/moduleRegistry';
import { useNativeEntitlement } from '../../src/purchases/useNativeEntitlement';
import { useRoundWalk } from '../../src/presentation/useRoundWalk';
import { RoundWalkBar } from '../../src/presentation/RoundWalkBar';
import { ReadoutStrip } from '../../src/presentation/ReadoutStrip';
import { SegmentedControl } from '../../src/presentation/SegmentedControl';
import { clearLiveState, liveReadings, publishLiveState, type LiveState } from '../../src/shared/chat/liveState';
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
 * What a learner does with a module, split rather than stacked.
 *
 * Everything used to be one ScrollView — scenario bar, diagram, readouts, trends, controls,
 * explainer, tutor and the whole question bank, in that order. On a phone that is several
 * screens of scrolling to reach the practice questions, and the explainer sat between the
 * controls and the questions for no reason other than the order the file was written in.
 *
 * The strip itself is `moduleTabs.ts`, shared with its own test: Lab | Questions | Lessons
 * everywhere, with Patients second on the modules that have beds — web order, web words.
 */

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
        {hasBaseline ? 'Baseline frozen, running trace overlays it' : 'Freeze this trace to compare scenarios'}
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
  cases,
  initialBedId,
}: {
  /** The registry id, which is also the key progress is recorded under. */
  moduleId: string;
  /** Both from the file-synced registry, not from the adapter. */
  title: string;
  accent: string;
  adapter: ModuleAdapter<TState, TInputs, TDerived, THistoryPoint>;
  /** This module's beds, already loaded — see `ModuleScreen` for why they arrive as a prop. */
  cases: readonly ModuleCase<string, any>[];
  /** `?case=<id>` off the round board, resolved before mount so the engine can open ON the
   *  patient rather than applying them in an effect a frame later. */
  initialBedId: string | null;
}) {
  const { color, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const hasCases = cases.length > 0;
  /** The collapsed dock's measured height, so the scroll below can clear it. */
  const [dockHeight, setDockHeight] = useState(0);

  const [bedId, setBedId] = useState<string | null>(initialBedId);
  const patient = useMemo(() => cases.find((bed) => bed.id === bedId) ?? null, [cases, bedId]);

  // Who is either side of this patient on the round, so the bedside can be walked rather than
  // returned to. `useNativeEntitlement` is called here rather than threaded down from
  // `ModuleScreen`: it is a store-backed hook, so a second caller costs a subscription and not
  // a fetch, and threading it would widen this component's props for one line of use.
  const walkEntitlement = useNativeEntitlement();
  const walk = useRoundWalk(bedId, walkEntitlement);
  const router = useRouter();

  // Arriving on a bed opens the bedside; arriving without one opens the instrument.
  const [tab, setTab] = useState<ModuleTab>(initialBedId ? 'clinic' : 'lab');
  const effectiveTab = clampTab(tab, hasCases);

  /**
   * The inputs a scenario resolves to. Bare defaults, or the patient's own scenario when the
   * screen was opened on a bed.
   *
   * SEEDED, not applied in an effect. The web states the same rule for `useShareableInputs`: a
   * patient applied after mount shows half a second of normal physiology and then jumps, which on
   * a bedside is the worst place in the app for it to happen. It costs nothing here because the
   * beds are resolved before this component renders at all.
   */
  const seedFor = useCallback(
    (bed: ModuleCase<string, any> | null): TInputs =>
      ({ ...adapter.defaults, ...(bed ? (adapter.presets[bed.preset] as any) : null) }) as TInputs,
    [adapter],
  );
  const [inputs, setInputs] = useState<TInputs>(() =>
    seedFor(cases.find((bed) => bed.id === initialBedId) ?? null),
  );
   
  const loop = useNativeEngineLoop<TState, TInputs, TDerived, THistoryPoint>(inputs, adapter.config as any);
  const { snapshot, history, baseline, reset, perturb, fastForward, transport } = loop;

  const handleChange = useMemo(
    () => <K extends keyof TInputs>(key: K, value: TInputs[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

   
  /* A view-only lens (which nutrient the digestion map traces) is screen state, never an input:
   * it changes what the diagram emphasises and nothing about the model, so it stays out of
   * presets and question setups. Undefined means the presentation's own `lens.initial`. */
  const [lens, setLens] = useState<string | undefined>(undefined);

  const presentation = useMemo(
    () =>
      adapter.build({
        state: snapshot.state,
        derived: snapshot.derived,
        inputs,
        history,
        baselineHistory: baseline.history,
        lens,
      } as any),
    [snapshot, inputs, history, baseline.history, adapter, lens],
  );
  const lensSpec = presentation.lens;
  const lensValue = lens ?? lensSpec?.initial;
  const lensToken = lensSpec?.options.find((option) => option.value === lensValue)?.colorToken;

   
  const showCtx = useMemo(() => ({ state: snapshot.state, derived: snapshot.derived, inputs }) as any, [snapshot, inputs]);

  const [activePreset, setActivePreset] = useState<string | null>(() =>
    initialBedId ? (cases.find((bed) => bed.id === initialBedId)?.preset ?? null) : null,
  );
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

  // The rail's own specs are what a nudge clamps to, so the button and the slider cannot disagree
  // about a range. `presentation.controls` is a hoisted module-scope constant in every module that
  // uses one, so the hook memoises rather than rebuilding on each of the engine's frames.
   
  const nudge = useInputNudge<TInputs>(setInputs, presentation.controls as any);

  const actions = useMemo(() => adapter.actions(inputs, perturb, nudge), [adapter, inputs, perturb, nudge]);

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

  /**
   * Both question tabs hand off to the instrument, which means switching to it.
   *
   * "Run in simulator" has to actually show the simulator — it could not, while everything was one
   * scroll and the question sat below the diagram — and a scenario opened from a question or from
   * an explainer's "show me" is the same move.
   */
  const openScenarioInLab = useCallback(
    (presetId: string) => {
      applyPreset(presetId);
      setTab('lab');
    },
    [applyPreset],
  );
  const runQuestionInLab = useCallback(
    (questionId: string) => {
      runQuestion(questionId);
      setTab('lab');
    },
    [runQuestion],
  );

  /**
   * Which questions belong to a bed and which do not.
   *
   * The Patients tab runs a patient's own questions and the Questions tab runs what is left, so
   * every question is reachable from exactly one tab — the property that makes the split worth
   * making. The leftovers are not an oversight: they are the questions whose scenario has no bed,
   * and the mechanism drills tied to no presentation at all.
   */
  const unclaimed = useMemo(() => unclaimedQuestions(adapter.questions, cases), [adapter.questions, cases]);
  const bedQuestions = useMemo(
    () => (patient?.questionIds ? adapter.questions.filter((q) => patient.questionIds!.includes(q.id)) : []),
    [adapter.questions, patient],
  );

  /**
   * Picking a bed loads that patient, in the same handler rather than in an effect watching the id.
   *
   * Without the second half, the round showed one patient's name over another's physiology and the
   * banner could not tell — the patient is the thing that changed. The web reaches this through an
   * effect because a bed change there is a URL change it has to observe; here `?case=` only ever
   * arrives at mount, since opening another bed pushes a new screen, so every in-screen change
   * comes through this function and an effect would only be a way to re-render twice.
   */
  const selectBed = useCallback(
    (nextBedId: string | null) => {
      setBedId(nextBedId);
      const next = cases.find((bed) => bed.id === nextBedId);
      if (next) applyPreset(next.preset);
    },
    [cases, applyPreset],
  );

  /**
   * What has been answered, and where it is written down.
   *
   * The rows are self-contained — each settles its own question off the render path and marks its
   * own answer — so the screen owns only the map they read from and the store they write to. That
   * is the same store the web uses: on-device until a learner signs in, the server after.
   */
  const store = useProgressStore();
  const [committed, setCommitted] = useState<ReadonlyMap<string, CommittedAnswer>>(() => new Map());
  const onCommit = useCallback(
    (questionId: string, picked: string, correct: boolean) => {
      setCommitted((prev) => new Map(prev).set(questionId, { picked, correct }));
      store.record(moduleId, questionId, correct);
    },
    [store, moduleId],
  );
  const schedule = store.summary(moduleId).schedule;

  /**
   * Withholds anything that would name the answer while a pattern question is unanswered — the
   * diagram's verdict, and any readout flagged `revealsPattern`.
   *
   * The web gates this on a live quiz session, which shows one question at a time. These tabs show
   * a LIST, so the equivalent is the set in front of the learner: the bed's questions once a bed is
   * picked, and the unclaimed set otherwise. It deliberately survives crossing to the Lab or to
   * Lessons, because that crossing is exactly the move it exists to stop — a learner reading the
   * classification off the diagram rather than working it out. Committing the last pattern question
   * in the set lifts it.
   */
  const blinded = useMemo(() => {
    const asking = patient ? bedQuestions : unclaimed;
    return asking.some((q) => isPatternQuestion(q) && !committed.has(q.id));
  }, [patient, bedQuestions, unclaimed, committed]);

  // Offer the readouts to the tutor as the screen the learner is looking at.
  //
  // Published from the SCREEN rather than from `ReadoutGridView`, which is where the web
  // publishes: the grid and the strip both live on the Simulate tab and unmount when a learner
  // switches to Practice or Learn, and the engine keeps running underneath. Asking the tutor
  // about a question on the Practice tab is exactly when the numbers matter most.
  const latest = useRef({ readouts: presentation.readouts, showCtx, blinded, moduleId });
  // No dep array: this runs after every commit, so what the tutor can read is always what the
  // learner can see, and never a frame that React rendered and threw away.
  useEffect(() => {
    latest.current = { readouts: presentation.readouts, showCtx, blinded, moduleId };
  });

  // One identity for the whole mount, which is what `clearLiveState` checks against on the way
  // out. It reads the ref rather than closing over the values, so it never goes stale.
  const liveSource = useCallback(
    (): LiveState => {
      const { readouts, showCtx: at, blinded: hidden, moduleId: id } = latest.current;
      return { moduleId: id, readings: liveReadings(readouts, at, hidden) };
    },
    [],
  );

  useEffect(() => {
    publishLiveState(liveSource);
    return () => clearLiveState(liveSource);
  }, [liveSource]);

  return (
    <View style={[styles.container, { backgroundColor: color.bg }]}>
      {/* Without this the stack header reads the route pattern, "module/[id]". The module name
          lives there rather than in the page body, which is where a native app expects it. */}
      <Stack.Screen options={{ title: title }} />

      {/* Both of these sit OUTSIDE the ScrollView, which is the point of them. The web is a
          two-column desktop layout with the control rail beside the readouts; here the rail is a
          dock at the bottom of the screen, so without a pinned copy of the headline numbers a
          learner dragging a slider cannot see the thing the slider moves. That is the whole
          proposition of the product. */}
      <View style={[styles.tabBar, { backgroundColor: color.panel, borderBottomColor: color.panelBorder }]}>
        <SegmentedControl segments={tabsForModule(hasCases)} value={effectiveTab} onChange={setTab} accent={accent} />
      </View>
      {/* On EVERY tab, unlike the case header: opening a bed lands on the Patients tab, so a
          walk that only rendered on Lab was missing from the one tab the round actually opens. */}
      <RoundWalkBar
        walk={walk}
        accent={accent}
        onWalk={(bed) => router.push(`/module/${bed.moduleId}?case=${bed.id}`)}
      />
      {effectiveTab === 'lab' && (
        <ReadoutStrip readouts={presentation.readouts} ctx={showCtx} moduleId={moduleId} blinded={blinded} />
      )}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          // Clears the collapsed dock, so the trends chart at the foot of the page stays reachable.
          { paddingBottom: (effectiveTab === 'lab' ? dockHeight : 0) + insets.bottom + SPACE.xxl },
        ]}
      >
        {/* One wrapper for all four tabs, keyed on which is showing: the content really is
            unmounted between tabs here, so the fade is an arrival rather than a crossfade. */}
        <TabFade tabKey={effectiveTab}>
        {effectiveTab === 'lab' && (
          <>
            {patient && (
              <CaseHeader
                patient={patient}
                activePreset={activePreset}
                presetLabels={adapter.labels}
                onReturn={() => applyPreset(patient.preset)}
                playing={transport.playing}
                accent={accent}
              />
            )}
            <ScenarioBar
              presets={adapter.order.map((id) => ({ id, label: adapter.labels[id] }))}
              activePreset={activePreset}
              onApplyPreset={applyPreset}
              actions={actions}
              accent={accent}
            />
            {lensSpec && lensValue !== undefined && (
              <ToggleGroup
                label={lensSpec.label}
                value={lensValue}
                options={lensSpec.options}
                onChange={setLens}
                accent={(lensToken ? lookupColor(lensToken, scheme) : undefined) ?? accent}
              />
            )}
            {presentation.diagram.map((frame, i) => (
              <DiagramView
                key={frame.key ?? i}
                frame={frame}
                blinded={blinded}
                classes={adapter.diagramClasses}
              />
            ))}
            <ReadoutGridView readouts={presentation.readouts} ctx={showCtx} moduleId={moduleId} blinded={blinded} />
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
                  capacity={adapter.config.historyCapacity}
                   
                  derived={snapshot.derived as any}
                />
              </>
            )}
          </>
        )}

        {effectiveTab === 'clinic' && (
          <ClinicPanel
            cases={cases}
            patient={patient}
            onSelectBed={selectBed}
            schedule={schedule}
            snapshot={snapshot}
            questions={bedQuestions}
            moduleId={moduleId}
            accent={accent}
            committed={committed}
            onCommit={onCommit}
            presetLabels={adapter.labels}
            presetGloss={adapter.gloss}
             
            config={adapter.config as any}
             
            defaults={adapter.defaults as any}
             
            presets={adapter.presets as any}
            onOpenScenario={openScenarioInLab}
            onRunQuestion={runQuestionInLab}
          />
        )}

        {effectiveTab === 'questions' && (
          <QuestionSet
            count={unclaimed.length}
            beds={cases}
            schedule={schedule}
            questions={unclaimed}
            onGoBedside={(bedId) => {
              selectBed(bedId);
              setTab('clinic');
            }}
            accent={accent}
            committed={committed}
            onCommit={onCommit}
            presetLabels={adapter.labels}
            presetGloss={adapter.gloss}
             
            config={adapter.config as any}
             
            defaults={adapter.defaults as any}
             
            presets={adapter.presets as any}
            onOpenScenario={openScenarioInLab}
            onRunQuestion={runQuestionInLab}
          />
        )}

        {effectiveTab === 'lessons' && (
          <>
            <ExplainerView
              content={adapter.content}
              accent={accent}
              onOpenScenario={openScenarioInLab}
              presetLabels={adapter.labels}
              // Same rule the web's preset bar follows: a demo button must not load a scenario
              // while a pattern question is open, because it would change the thing being named.
              scenariosLocked={blinded}
            />
            <TutorPanel moduleId={moduleId} accent={accent} />
          </>
        )}
        </TabFade>
      </ScrollView>

      {/* Outside the scroll, over it: the transport and the sliders, collapsed by default. */}
      {effectiveTab === 'lab' && (
        <ControlDock
          controls={presentation.controls}
          inputs={inputs}
          onChange={handleChange}
          accent={accent}
          transport={transport}
          onHeadLayout={setDockHeight}
        />
      )}
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
  const { id, case: caseId } = useLocalSearchParams<{ id: string; case?: string }>();
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
  const entitlement = useNativeEntitlement();

  const [loaded, setLoaded] = useState<{
    id: string;
    adapter: AnyModuleAdapter;
    cases: readonly ModuleCase<string, any>[];
  } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  /**
   * The beds load WITH the adapter, not after it.
   *
   * `EngineModuleScreen` seeds its inputs from the patient in a lazy initialiser, so it has to know
   * the bed before its first render — otherwise a learner arriving from the ward round watches
   * normal physiology for a frame and then the patient snaps in. Waiting for both here costs
   * nothing that was not already being waited for: the spinner below is already up, and
   * `loadModuleCases` answers immediately with an empty array for the modules that have none.
   */
  useEffect(() => {
    if (!loader) return;
    let live = true;
    Promise.all([loader(), loadModuleCases(moduleId)])
      .then(([mod, cases]) => {
        if (live) setLoaded({ id: moduleId, adapter: mod.adapter, cases });
      })
      .catch(() => {
        if (live) setFailed(moduleId);
      });
    return () => {
      live = false;
    };
  }, [loader, moduleId]);

  const loadedForThis = loaded?.id === moduleId ? loaded : null;
  const adapter = loadedForThis?.adapter ?? null;

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
   * `useNativeEntitlement` answers from Supabase or from RevenueCat, whichever says yes: an
   * institutional seat, a subscription bought on the web, and one bought here all unlock the
   * same way.
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
          <Pressable accessibilityRole="button">
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
      cases={loadedForThis?.cases ?? []}
      // A `?case=` naming a bed this module does not have resolves to no bed rather than to an
      // error: the id travels in a shareable link, and a stale one should open the module.
      initialBedId={caseId ?? null}
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
