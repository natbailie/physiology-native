import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ScrollView, Text, View, useColorScheme } from 'react-native';
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
import { lookupColor } from '../../src/presentation/palette';

/** A pattern question has an `options` field; a prediction question has an intervention. */
function isPatternLike(q: any): boolean {
  return Boolean(q && 'options' in q);
}

function BaselineBar({ hasBaseline, onCapture, onClear }: { hasBaseline: boolean; onCapture: () => void; onClear: () => void }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={styles.baselineBar}>
      <Text style={[styles.baselineHint, isDark && styles.textMuted]}>
        {hasBaseline ? 'Baseline frozen — running trace overlays it' : 'Freeze this trace to compare scenarios'}
      </Text>
      {hasBaseline ? (
        <Pressable onPress={onClear} style={({ pressed }) => [styles.baselineButton, pressed && styles.optionPressed]}>
          <Text style={styles.baselineButtonText}>Clear baseline</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onCapture} style={({ pressed }) => [styles.baselineButton, pressed && styles.optionPressed]}>
          <Text style={styles.baselineButtonText}>Set baseline</Text>
        </Pressable>
      )}
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <ScrollView style={[styles.container, isDark && styles.containerDark]} contentContainerStyle={styles.content}>
      {/* Without this the stack header reads the route pattern, "module/[id]". The module name
          lives there rather than in the page body, which is where a native app expects it. */}
      <Stack.Screen options={{ title: title }} />
      <ScenarioBar
        presets={adapter.order.map((id) => ({ id, label: adapter.labels[id] }))}
        activePreset={activePreset}
        onApplyPreset={applyPreset}
        actions={actions}
      />
      {presentation.diagram.map((frame, i) => (
        <DiagramView key={frame.key ?? i} frame={frame} blinded={blinded} classes={adapter.diagramClasses} />
      ))}
      <ReadoutGridView readouts={presentation.readouts} ctx={showCtx} blinded={blinded} />
      {presentation.charts.length > 0 && (
        <>
          <BaselineBar
            hasBaseline={baseline.history !== null}
            onCapture={baseline.capture}
            onClear={baseline.clear}
          />
          <TrendsView
            charts={presentation.charts}
            history={history}
            baselineHistory={baseline.history}
             
            derived={snapshot.derived as any}
          />
        </>
      )}
      <ControlRailView controls={presentation.controls} inputs={inputs} onChange={handleChange} accent={accent} />
      <ExplainerView
        content={adapter.content}
        accent={accent}
        onOpenScenario={applyPreset}
        presetLabels={adapter.labels}
      />
      <TutorPanel moduleId={moduleId} accent={accent} />
      <PracticePanel
         
        config={adapter.config as any}
         
        defaults={adapter.defaults as any}
         
        presets={adapter.presets as any}
         
        questions={adapter.questions as any}
        title={title}
        accent={accent}
        onOpenScenario={applyPreset}
        onRunQuestion={runQuestion}
        onBlindedChange={setBlinded}
        onRecord={recordOutcome}
      />
    </ScrollView>
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={[styles.errorText, isDark && styles.textLight]}>Module not found</Text>
      </View>
    );
  }

  /**
   * Resolved before the guards below, all of which use it. `accentColorVar` is a CSS reference —
   * `var(--artery)` — and a handful of registry entries carry none, so the muted text grey is the
   * fallback.
   */
  const accent =
    lookupColor(descriptor.accentColorVar?.match(/^var\(--([a-z0-9-]+)\)$/)?.[1], isDark ? 'dark' : 'light') ??
    '#64748b';

  /**
   * The paywall. Three systems are free and the rest need full access, which is what the web
   * gates on — this app shipped all 45 free, which was simply a leak.
   *
   * `useEntitlement` reads the state from Supabase, so an institutional seat or a subscription
   * bought on the web both unlock here with no purchase code in this app at all.
   */
  if (entitlement.status !== 'loading' && !entitlement.isUnlocked(moduleId)) {
    return (
      <View style={[styles.center, styles.locked]}>
        <Stack.Screen options={{ title: descriptor.name }} />
        <Text style={[styles.lockedTitle, isDark && styles.textLight]}>{descriptor.name}</Text>
        <Text style={[styles.errorText, isDark && styles.textMuted]}>
          This simulator is part of full access.
        </Text>
        {/* The styling sits on an inner View, not on the Pressable: `Link asChild` forwards its
            own props onto the child, and its undefined `style` clobbers one set here. Same shape
            as the cards on the home screen. */}
        <Link href="/pricing" asChild>
          <Pressable>
            {({ pressed }) => (
              <View style={[styles.lockedButton, { backgroundColor: accent }, pressed && styles.optionPressed]}>
                <Text style={styles.lockedButtonText}>See full access</Text>
              </View>
            )}
          </Pressable>
        </Link>
      </View>
    );
  }

  if (failed === moduleId) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: descriptor.name }} />
        <Text style={[styles.errorText, isDark && styles.textLight]}>
          {descriptor.name} could not be loaded
        </Text>
      </View>
    );
  }

  if (!adapter) {
    return (
      <View style={styles.center}>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  locked: { padding: 32, gap: 12 },
  lockedTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  lockedButton: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: 4 },
  lockedButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  textLight: { color: '#e2e8f0' },
  textMuted: { color: '#94a3b8' },
  baselineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  baselineHint: { fontSize: 12, color: '#475569', flexShrink: 1, paddingRight: 8 },
  baselineButton: { backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  baselineButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  optionPressed: { opacity: 0.6 },
});
