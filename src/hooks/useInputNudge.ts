import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { clamp } from '../engine/math';
import type { ControlSpec } from '../presentation/types';

/**
 * A standing change to the patient, applied to the INPUTS and clamped to the slider's own range.
 *
 * A hand-written twin of the web's `src/shared/hooks/useInputNudge.ts`, for the same reason
 * `ReadoutGridView` is a hand-written twin of `ReadoutItem`: this is the wiring between the synced
 * engine and a per-platform rail, and `src/hooks` is outside `SYNCED_ONLY_DIRS`. Change one, change
 * both — `sync-engines.mjs --check` cannot see this file.
 *
 * The distinction it exists to draw: `perturb` writes engine state for something momentary, and a
 * nudge writes the inputs for something that stays. A litre of blood lost stays lost, and the
 * blood-volume slider has to move with it.
 */
export function useInputNudge<TInputs>(
  setInputs: Dispatch<SetStateAction<TInputs>>,
  controls: readonly ControlSpec<TInputs>[],
): (deltas: Partial<Record<string & keyof TInputs, number>>) => void {
  const ranges = useMemo(() => {
    const byKey = new Map<string, { min: number; max: number; step: number }>();
    for (const control of controls) {
      if (control.kind === 'slider') {
        byKey.set(control.key, { min: control.min, max: control.max, step: control.step });
      }
    }
    return byKey;
  }, [controls]);

  return useCallback(
    (deltas: Partial<Record<string & keyof TInputs, number>>) => {
      setInputs((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(deltas)) {
          const delta = value as number | undefined;
          if (delta === undefined) continue;
          const range = ranges.get(key);
          if (!range) throw new Error(`useInputNudge: "${key}" is not a slider on this module`);
          const raw = clamp((prev as Record<string, number>)[key]! + delta, range.min, range.max);
          const snapped = range.min + Math.round((raw - range.min) / range.step) * range.step;
          (next as Record<string, unknown>)[key] = clamp(snapped, range.min, range.max);
        }
        return next;
      });
    },
    [setInputs, ranges],
  );
}
