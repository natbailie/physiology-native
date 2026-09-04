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

/** Speed multipliers applied on top of each module's own `timeScale`. 1 is the module's calibrated
 * pace; the slow settings exist so fast events can be watched rather than inferred. The same list
 * the web offers, so a module runs at the same speeds in both apps. */
export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4] as const;

/** One press of "Step" advances this much REAL time (then scaled by timeScale and speed). Chosen
 * to be a visible nudge rather than a single imperceptible frame; matches the web. */
const STEP_REAL_SECONDS = 0.25;

export interface NativeSimBaseline<THistoryPoint> {
  history: THistoryPoint[] | null;
  capture: () => void;
  clear: () => void;
}

/** Play/pause/step/speed over simulated time. The same shape as the web's `SimTransport`, minus
 * the `reset` the web's Reset button calls — this app has no Reset button. */
export interface NativeSimTransport {
  playing: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Advance a fixed slice of time while paused. No-op while playing. */
  stepOnce: () => void;
  setSpeed: (multiplier: number) => void;
}

export interface UseNativeEngineLoopResult<TState, TInputs, TDerived, THistoryPoint> {
  snapshot: { state: TState; derived: TDerived };
  history: THistoryPoint[];
  reset: (inputsOverride?: TInputs) => void;
  perturb: (fn: (state: TState) => TState) => void;
  fastForward: (seconds: number, inputsOverride?: TInputs) => void;
  /** Whether the learner has left it playing. Not whether it is currently integrating — a
   * backgrounded app is not, and that is deliberately invisible here. */
  playing: boolean;
  transport: NativeSimTransport;
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

  /**
   * Two independent gates on the tick, because they answer different questions and collapsing
   * them into one flag is what used to freeze a module permanently: backgrounding cleared the
   * only flag there was, so `wasPlaying` on the way back read the value background had just
   * written and the loop never restarted.
   *
   * `userPlayingRef` is intent — what the Pause button sets, and what the button renders from.
   * `foregroundRef` is the OS gate, so a long absence isn't replayed as one enormous jump.
   */
  const [playing, setPlaying] = useState(true);
  const userPlayingRef = useRef(true);
  const foregroundRef = useRef(true);

  // Applied on top of the module's own timeScale.
  const [speed, setSpeedState] = useState(1);
  const speedRef = useRef(1);

  // Keep inputs/config fresh in refs without tearing down the loop.
  useEffect(() => {
    const previous = inputsRef.current;
    inputsRef.current = inputs;
    configRef.current = config;
    if (sameInputs(previous, inputs)) return;
    const cfg = configRef.current;
    setSnapshot((prev) => ({ state: prev.state, derived: cfg.computeDerived(prev.state, inputs) }));
  }, [inputs, config]);

  /** Publishes the engine's current state to React outside the publish interval, for the callers
   * — perturb, step, fastForward — whose whole point is that the change is visible now. */
  const publish = useCallback(() => {
    const cfg = configRef.current;
    setSnapshot({
      state: stateRef.current,
      derived: cfg.computeDerived(stateRef.current, inputsRef.current),
    });
    setHistory(historyRef.current.toArray());
  }, []);

  const advance = useCallback((realSeconds: number) => {
    const cfg = configRef.current;
    let remaining = realSeconds * cfg.timeScale * speedRef.current;
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
      if (userPlayingRef.current && foregroundRef.current) {
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

  // Pause integration when the app backgrounds so a long absence isn't replayed as one jump. The
  // learner's own play/pause is untouched by this, which is why it resumes on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      foregroundRef.current = next === 'active';
    });
    return () => sub.remove();
  }, []);

  const perturb = useCallback((fn: (state: TState) => TState) => {
    stateRef.current = fn(stateRef.current);
    publish();
  }, [publish]);

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

  const play = useCallback(() => {
    userPlayingRef.current = true;
    setPlaying(true);
  }, []);
  const pause = useCallback(() => {
    userPlayingRef.current = false;
    setPlaying(false);
  }, []);
  const toggle = useCallback(() => {
    const next = !userPlayingRef.current;
    userPlayingRef.current = next;
    setPlaying(next);
  }, []);
  const stepOnce = useCallback(() => {
    if (userPlayingRef.current) return;
    advance(STEP_REAL_SECONDS);
    publish();
  }, [advance, publish]);
  const setSpeed = useCallback((multiplier: number) => {
    speedRef.current = multiplier;
    setSpeedState(multiplier);
  }, []);

  const transport: NativeSimTransport = useMemo(
    () => ({ playing, speed, play, pause, toggle, stepOnce, setSpeed }),
    [playing, speed, play, pause, toggle, stepOnce, setSpeed],
  );

  const captureBaseline = useCallback(() => setBaselineHistory(historyRef.current.toArray()), []);
  const clearBaseline = useCallback(() => setBaselineHistory(null), []);
  const baseline: NativeSimBaseline<THistoryPoint> = useMemo(
    () => ({ history: baselineHistory, capture: captureBaseline, clear: clearBaseline }),
    [baselineHistory, captureBaseline, clearBaseline],
  );

  return { snapshot, history, reset, perturb, fastForward, playing, transport, baseline };
}
