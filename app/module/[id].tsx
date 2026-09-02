import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, ScrollView, Text, View, useColorScheme } from 'react-native';
import { DiagramView } from '../../src/presentation/DiagramView';
import { ControlRailView } from '../../src/presentation/ControlRailView';
import { ReadoutGridView } from '../../src/presentation/ReadoutGridView';
import { TrendsView } from '../../src/presentation/TrendsView';
import { ScenarioBar } from '../../src/presentation/ScenarioBar';
import type { ModulePresentation, PresentationContext } from '../../src/presentation/types';
import { PracticePanel } from '../../src/presentation/PracticePanel';
import { useNativeEngineLoop, type NativeLoopConfig } from '../../src/hooks/useNativeEngineLoop';

import { glucoseNativeLoopConfig } from '../../src/engine/glucose/nativeLoopConfig';
import { buildGlucosePresentation } from '../../src/engine/glucose/presentation';
import {
  DEFAULT_GLUCOSE_INPUTS,
  GLUCOSE_PRESETS,
  GLUCOSE_PRESET_LABELS,
  PRESET_ORDER as GLUCOSE_PRESET_ORDER,
} from '../../src/engine/glucose/presets';
import { perturbEatMeal, perturbGiveInsulin } from '../../src/engine/glucose/engine';
import { GLUCOSE_QUESTIONS } from '../../src/engine/glucose/questions';
import type { GlucoseDerived, GlucoseHistoryPoint, GlucoseInputs, GlucoseState } from '../../src/engine/glucose/types';

import { cardiorenalNativeLoopConfig } from '../../src/engine/cardiorenal/nativeLoopConfig';
import { buildCardiorenalPresentation } from '../../src/engine/cardiorenal/presentation';
import {
  DEFAULT_INPUTS as CARDIORENAL_DEFAULTS,
  PRESETS as CARDIORENAL_PRESETS,
  PRESET_LABELS as CARDIORENAL_PRESET_LABELS,
  PRESET_ORDER as CARDIORENAL_PRESET_ORDER,
} from '../../src/engine/cardiorenal/presets';
import { perturbBloodVolume } from '../../src/engine/cardiorenal/engine';
import { CARDIORENAL_QUESTIONS } from '../../src/engine/cardiorenal/questions';
import type { DerivedValues, HistoryPoint, SimInputs, SimState } from '../../src/engine/cardiorenal/types';

import { respiratoryNativeLoopConfig } from '../../src/engine/respiratory/nativeLoopConfig';
import { buildRespiratoryPresentation } from '../../src/engine/respiratory/presentation';
import {
  DEFAULT_RESP_INPUTS,
  RESP_PRESETS,
  RESP_PRESET_LABELS,
  PRESET_ORDER as RESP_PRESET_ORDER,
} from '../../src/engine/respiratory/presets';
import { perturbAirwayObstruction } from '../../src/engine/respiratory/engine';
import { RESPIRATORY_QUESTIONS } from '../../src/engine/respiratory/questions';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from '../../src/engine/respiratory/types';

/* ------------------------------------------------------------------ */
/*  Module adapters                                                    */
/* ------------------------------------------------------------------ */

interface ModuleAdapter<TState, TInputs, TDerived, THistoryPoint> {
  title: string;
  accent: string;
  config: NativeLoopConfig<TState, TInputs, TDerived, THistoryPoint>;
  build: (ctx: PresentationContext<TState, TDerived, TInputs, THistoryPoint>) => ModulePresentation<TState, TDerived, TInputs, THistoryPoint>;
  defaults: TInputs;
  presets: Record<string, Partial<TInputs>>;
  labels: Record<string, string>;
  order: string[];
   
  questions: readonly any[];
  presetActiveKey: (id: string) => string;
  actions: (inputs: TInputs, perturb: (fn: (state: TState) => TState) => void) => { label: string; onPress: () => void; variant: 'impulse' }[];
}

const MODULE_ADAPTERS: Record<string, ModuleAdapter<unknown, unknown, unknown, unknown>> = {
  glucoseRegulation: {
    title: 'Glucose Regulation',
    accent: '#22c55e',
     
    config: glucoseNativeLoopConfig as any,
     
    build: ((ctx: PresentationContext<GlucoseState, GlucoseDerived, GlucoseInputs, GlucoseHistoryPoint>) =>
      buildGlucosePresentation(ctx)) as any,
     
    defaults: DEFAULT_GLUCOSE_INPUTS as any,
     
    presets: GLUCOSE_PRESETS as any,
     
    labels: GLUCOSE_PRESET_LABELS as any,
    order: GLUCOSE_PRESET_ORDER as string[],
    questions: GLUCOSE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Eat meal', onPress: () => perturb((s) => perturbEatMeal(s as GlucoseState, (inputs as GlucoseInputs).mealCarbLoadGrams)), variant: 'impulse' },
      { label: 'Give insulin', onPress: () => perturb((s) => perturbGiveInsulin(s as GlucoseState, (inputs as GlucoseInputs).exogenousInsulinUnits)), variant: 'impulse' },
    ],
  },
  cardiorenal: {
    title: 'Cardiorenal',
    accent: '#ef4444',
     
    config: cardiorenalNativeLoopConfig as any,
     
    build: ((ctx: PresentationContext<SimState, DerivedValues, SimInputs, HistoryPoint>) =>
      buildCardiorenalPresentation(ctx)) as any,
     
    defaults: CARDIORENAL_DEFAULTS as any,
     
    presets: CARDIORENAL_PRESETS as any,
     
    labels: CARDIORENAL_PRESET_LABELS as any,
    order: CARDIORENAL_PRESET_ORDER as string[],
    questions: CARDIORENAL_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (_, perturb) => [
      { label: 'Haemorrhage', onPress: () => perturb((s) => perturbBloodVolume(s as SimState, 0.7)), variant: 'impulse' },
    ],
  },
  respiratory: {
    title: 'Respiratory & Acid-Base',
    accent: '#3b82f6',
     
    config: respiratoryNativeLoopConfig as any,
     
    build: ((ctx: PresentationContext<RespState, RespDerived, RespInputs, RespHistoryPoint>) =>
      buildRespiratoryPresentation(ctx)) as any,
     
    defaults: DEFAULT_RESP_INPUTS as any,
     
    presets: RESP_PRESETS as any,
     
    labels: RESP_PRESET_LABELS as any,
    order: RESP_PRESET_ORDER as string[],
    questions: RESPIRATORY_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (_, perturb) => [
      { label: 'Airway obstruction', onPress: () => perturb((s) => perturbAirwayObstruction(s as RespState)), variant: 'impulse' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Generic live module screen                                         */
/* ------------------------------------------------------------------ */

/** A pattern question has an `options` field; a prediction question has an intervention. */
function isPatternLike(q: any): boolean {
  return Boolean(q && 'options' in q);
}

/** Freeze the current trace as a dotted overlay to compare a scenario against a patient's own
 *  baseline — the same "frozen baseline" teaching feature the web app uses for two-run
 *  comparisons. */
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
  adapter,
}: {
  adapter: ModuleAdapter<TState, TInputs, TDerived, THistoryPoint>;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [inputs, setInputs] = useState<TInputs>(adapter.defaults);
   
  const loop = useNativeEngineLoop<TState, TInputs, TDerived, THistoryPoint>(inputs, adapter.config as any);
  const { snapshot, history, baseline, reset, perturb } = loop;

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
    },
    [adapter, reset],
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

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, isDark && styles.textLight]}>{adapter.title}</Text>
      <ScenarioBar
        presets={adapter.order.map((id) => ({ id, label: adapter.labels[id] }))}
        activePreset={activePreset}
        onApplyPreset={applyPreset}
        actions={actions}
      />
      {presentation.diagram.map((frame, i) => (
        <DiagramView key={frame.key ?? i} frame={frame} />
      ))}
      <ReadoutGridView readouts={presentation.readouts} ctx={showCtx} />
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
      <ControlRailView controls={presentation.controls} inputs={inputs} onChange={handleChange} />
      <PracticePanel
         
        config={adapter.config as any}
         
        defaults={adapter.defaults as any}
         
        presets={adapter.presets as any}
         
        questions={adapter.questions as any}
        title={adapter.title}
        accent={adapter.accent}
        onOpenScenario={applyPreset}
        onRunQuestion={runQuestion}
      />
    </ScrollView>
  );
}

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const adapter = MODULE_ADAPTERS[id ?? ''];

  if (!adapter) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, isDark && styles.textLight]}>Module not found</Text>
      </View>
    );
  }

  return <EngineModuleScreen adapter={adapter} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  errorText: { fontSize: 16, color: '#64748b' },
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
