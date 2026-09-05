import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useAuthOptional } from '../auth/AuthContext';
import { type Entitlement, useEntitlement } from '../billing/useEntitlement';
import { hasActiveEntitlement, isRevenueCatConfigured } from './revenuecat';

/**
 * The entitlement the app actually gates on: what Supabase says, OR what RevenueCat says.
 *
 * `useEntitlement` is synced byte-for-byte from the web project and reads `v_entitlement`, which
 * resolves an institutional seat against a personal subscription in SQL. That stays the
 * authoritative answer and this hook does not replace it — it adds a second way to say yes.
 *
 * The reason is a gap only the phone has. On the web, a purchase and the entitlement row are
 * written by the same RevenueCat webhook, so polling Supabase is enough. Here a purchase can
 * complete against a store the webhook has not been pointed at yet — the Test Store during
 * development being the obvious case — and the buyer would sit behind a paywall they have just
 * paid to remove until the plumbing is finished. RevenueCat's own `customerInfo` closes that gap,
 * and unlike the optimistic grant inside `confirmSubscription` it survives a relaunch, because it
 * is a real receipt read back from the store rather than a note we left ourselves.
 *
 * Never the other way round: RevenueCat knows nothing about institutional seats, so it can only
 * ever add access, never withdraw it.
 */

/** Bumped after a purchase or a restore, so every screen re-reads rather than waiting for resume. */
let revision = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getRevision = () => revision;

/** Tell every consumer to ask the store again. */
export function invalidateStoreEntitlement() {
  revision += 1;
  for (const listener of listeners) listener();
}

export function useNativeEntitlement(): Entitlement {
  const base = useEntitlement();
  const { user } = useAuthOptional() ?? { user: null };
  const userId = user?.id ?? null;

  const revisionNow = useSyncExternalStore(subscribe, getRevision, getRevision);

  // Keyed by the learner it was read for, so signing out is a derivation rather than a reset —
  // an effect that sets state synchronously just to clear it causes a second render pass.
  const [receipt, setReceipt] = useState<{ userId: string; active: boolean } | null>(null);
  const storeActive = receipt !== null && receipt.userId === userId && receipt.active;

  useEffect(() => {
    if (!isRevenueCatConfigured || userId === null) return;

    let cancelled = false;
    const read = () => {
      void hasActiveEntitlement(userId).then((active) => {
        if (!cancelled) setReceipt({ userId, active });
      });
    };

    read();

    // A subscription bought or cancelled outside the app — in the App Store, on the web, on
    // another device — shows up when the learner comes back to it.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId, revisionNow]);

  return useMemo(() => {
    if (!storeActive) return base;

    // Supabase still wins on *why*, when it has an answer: an institutional seat is a truer
    // description of the same access than "subscription" is.
    return {
      status: 'active',
      source: base.status === 'active' ? base.source : 'subscription',
      institutionName: base.institutionName,
      isUnlocked: () => true,
    };
  }, [base, storeActive]);
}
