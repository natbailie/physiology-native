import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { RingBuffer } from '../shared/lib/ringBuffer';

export interface NativeLoopConfig<TState, TInputs, TDerived, THistoryPoint> {
  createInitialState: () => TState;
  step: (state: TState, inputs: TInputs, dtSeconds: number) => { state: TState; derived: TDerived };
  computeDerived: (state: TState, inputs: TInputs) => TDerived;
  toHistoryPoint: (snapshot: { state: TState; derived: TDerived }) => THistoryPoint;
  maxDtSeconds: number;
  renderIntervalMs: number;
  historyCapacity: number;
  timeScale: number;
  settleSeconds?: number;
}

const MAX_FRAME_SECONDS = 0.05;

export interface NativeSimBaseline<THistoryPoint> {
  history: THistoryPoint[] | null;
  capture: () => void;
  clear: () => void;
}

export interface UseNativeEngineLoopResult<TState, TInputs, TDerived, THistoryPoint> {
  snapshot: { state: TState; derived: TDerived };
  history: THistoryPoint[];
  reset: (inputsOverride?: TInputs) => void;
  perturb: (fn: (state: TState) => TState) => void;
  fastForward: (seconds: number, inputsOverride?: TInputs) => void;
  /** The glucose page is playing whenever mounted (native has no simulate-transport UI yet). */
  playing: boolean;
  baseline: NativeSimBaseline<THistoryPoint>;
}

function settledState<TState, TInputs, TDerived, THistoryPoint>(
  cfg: NativeLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  inputs: TInputs,
): TState {
  const fresh = cfg.createInitialState();
  const seconds = cfg.settleSeconds ?? 0;
  if (seconds <= 0) return fresh;
  let state = fresh;
  let remaining = seconds;
  while (remaining > 0) {
    const dt = Math.min(remaining, cfg.maxDtSeconds);
    remaining -= dt;
    state = cfg.step(state, inputs, dt).state;
  }
  return state;
}

function sameInputs<TInputs>(a: TInputs, b: TInputs): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const keys = Object.keys(a as object);
  if (keys.length !== Object.keys(b as object).length) return false;
  return keys.every((key) => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

function nowSeconds(): number {
  return Date.now() / 1000;
}

/**
 * Drives a module's simulation on the native side. The engine core is shared (a file-synced pure
 * port of the web engine), so the physics is identical; only the loop plumbing differs — a RN
 * `setInterval` at the render interval combined with a closed-over wall-clock, instead of a
 * `requestAnimationFrame` that also measures frame time. The engine still advances in
 * `maxDtSeconds`-bounded sub-steps, history is still a bounded buffer, and input changes re-derive
 * the snapshot immediately so readouts reflect a dragged slider even while paused.
 *
 * The interval is throttled to `renderIntervalMs` for snapshot/history publishing, but the engine
 * itself integrates on its own schedule keyed off wall-clock deltas, so a `maxDtSeconds`-capped
 * step is always applied — the same sub-stepping the web loop and the verification harness use.
 */
export function useNativeEngineLoop<TState, TInputs, TDerived, THistoryPoint>(
  inputs: TInputs,
  config: NativeLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
): UseNativeEngineLoopResult<TState, TInputs, TDerived, THistoryPoint> {
  const inputsRef = useRef(inputs);
  const configRef = useRef(config);

  const [initialState] = useState(() => settledState(config, inputs));
  const stateRef = useRef(initialState);
  const historyRef = useRef(new RingBuffer<THistoryPoint>(config.historyCapacity));

  const [snapshot, setSnapshot] = useState<{ state: TState; derived: TDerived }>(() => ({
    state: initialState,
    derived: config.computeDerived(initialState, inputs),
  }));
  const [history, setHistory] = useState<THistoryPoint[]>([]);
  const [baselineHistory, setBaselineHistory] = useState<THistoryPoint[] | null>(null);

  // The native app has no play/pause SimControls yet, so it plays by default. The ref is what the
  // interval callbacks read; the state is what renders, and is kept in step with it so a future
  // transport UI gets a value that actually re-renders.
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(true);

  // Keep inputs/config fresh in refs without tearing down the loop.
  useEffect(() => {
    const previous = inputsRef.current;
    inputsRef.current = inputs;
    configRef.current = config;
    if (sameInputs(previous, inputs)) return;
    const cfg = configRef.current;
    setSnapshot((prev) => ({ state: prev.state, derived: cfg.computeDerived(prev.state, inputs) }));
  }, [inputs, config]);

  const advance = useCallback((realSeconds: number) => {
    const cfg = configRef.current;
    let remaining = realSeconds * cfg.timeScale;
    let result: { state: TState; derived: TDerived } | null = null;
    while (remaining > 0) {
      const chunk = Math.min(remaining, cfg.maxDtSeconds);
      remaining -= chunk;
      result = cfg.step(stateRef.current, inputsRef.current, chunk);
      stateRef.current = result.state;
      historyRef.current.push(cfg.toHistoryPoint(result));
    }
    return result;
  }, []);

  useEffect(() => {
    const cfg = configRef.current;

    // Fixed tick cadence for integrating real wall-clock time, independent of the (faster OR
    // slower) publish interval. Publishing is governed by renderIntervalMs below.
    // A plain local, not a ref: it is only read and written by the two closures created inside this
    // effect, and calling a hook from an effect callback throws (the dispatcher is reset to
    // ContextOnlyDispatcher once render finishes).
    let lastTick = nowSeconds();
    const tickId = setInterval(() => {
      const now = nowSeconds();
      const realDt = Math.min(now - lastTick, MAX_FRAME_SECONDS);
      lastTick = now;
      if (playingRef.current) {
        advance(realDt);
      }
    }, 16); // ~60Hz physics, hex frame boundary

    const publishId = setInterval(() => {
      setSnapshot({
        state: stateRef.current,
        derived: configRef.current.computeDerived(stateRef.current, inputsRef.current),
      });
      setHistory(historyRef.current.toArray());
    }, cfg.renderIntervalMs);

    return () => {
      clearInterval(tickId);
      clearInterval(publishId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause integration when the app backgrounds so a long absence isn't replayed as one jump.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const wasPlaying = playingRef.current;
      if (next === 'background') {
        playingRef.current = false;
        setPlaying(false);
      } else if (next === 'active' && wasPlaying) {
        playingRef.current = true;
        setPlaying(true);
      }
    });
    return () => sub.remove();
  }, []);

  const perturb = useCallback((fn: (state: TState) => TState) => {
    const cfg = configRef.current;
    stateRef.current = fn(stateRef.current);
    setSnapshot({
      state: stateRef.current,
      derived: cfg.computeDerived(stateRef.current, inputsRef.current),
    });
    setHistory(historyRef.current.toArray());
  }, []);

  const fastForward = useCallback((seconds: number, inputsOverride?: TInputs) => {
    const cfg = configRef.current;
    const activeInputs = inputsOverride ?? inputsRef.current;
    let remaining = seconds;
    let state = stateRef.current;
    while (remaining > 0) {
      const dt = Math.min(remaining, cfg.maxDtSeconds);
      remaining -= dt;
      state = cfg.step(state, activeInputs, dt).state;
    }
    stateRef.current = state;
    setSnapshot({ state, derived: cfg.computeDerived(state, activeInputs) });
    setHistory(historyRef.current.toArray());
  }, []);

  const reset = useCallback((inputsOverride?: TInputs) => {
    const cfg = configRef.current;
    const activeInputs = inputsOverride ?? inputsRef.current;
    stateRef.current = settledState(cfg, activeInputs);
    historyRef.current = new RingBuffer<THistoryPoint>(cfg.historyCapacity);
    setSnapshot({
      state: stateRef.current,
      derived: cfg.computeDerived(stateRef.current, activeInputs),
    });
    setHistory([]);
  }, []);

  const captureBaseline = useCallback(() => setBaselineHistory(historyRef.current.toArray()), []);
  const clearBaseline = useCallback(() => setBaselineHistory(null), []);
  const baseline: NativeSimBaseline<THistoryPoint> = useMemo(
    () => ({ history: baselineHistory, capture: captureBaseline, clear: clearBaseline }),
    [baselineHistory, captureBaseline, clearBaseline],
  );

  return { snapshot, history, reset, perturb, fastForward, playing, baseline };
}
