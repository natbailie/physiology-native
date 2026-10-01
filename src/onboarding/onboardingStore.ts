import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Whether this device has been through the first-run screens.
 *
 * A device flag, not an account one: the walkthrough is about the APP (what it is, what is free),
 * and a learner reinstalling or opening it signed out on a new phone should see it once there too.
 * It is separate from the account-level `onboarded` flag the web's sign-up flow keeps in auth
 * metadata, which is about the plans page shown after creating an account.
 *
 * Three states rather than a boolean, so the first frame can wait for the answer instead of
 * flashing the catalogue and then yanking the learner onto the walkthrough:
 *   loading -> (needed | done)
 *
 * Module-level store for the same reason `theme.ts` and `useEntitlement` use one: the gate lives in
 * the tab layout and the screen that completes it lives in the root stack, and a provider between
 * them would buy nothing.
 */
export type OnboardingStatus = 'loading' | 'needed' | 'done';

const STORAGE_KEY = 'physiology.onboarded';

let status: OnboardingStatus = 'loading';
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getStatus = () => status;

void AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    status = stored === '1' ? 'done' : 'needed';
    emit();
  })
  .catch(() => {
    // No storage: treat it as done. Showing a walkthrough that can never be remembered would
    // put the learner through it on every launch, which is worse than never showing it.
    status = 'done';
    emit();
  });

/** Skip and finish are the same outcome: the walkthrough has been offered and will not return. */
export function completeOnboarding(): void {
  status = 'done';
  emit();
  void AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {
    /* It still counts for this session. */
  });
}

export function useOnboardingStatus(): OnboardingStatus {
  return useSyncExternalStore(subscribe, getStatus, getStatus);
}
