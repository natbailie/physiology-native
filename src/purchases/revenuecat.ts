import Purchases, {
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';
import { FALLBACK_PACKAGES, type PlanPackage } from '../billing/config';
import { revenueCatApiKey } from '../lib/env';

/**
 * RevenueCat's native SDK — the in-app purchase half of the paywall.
 *
 * The web project has a sibling to this at `src/billing/revenuecat.ts`, and the two are worth
 * reading together: same App User ID, same offering, same entitlement, different store. What
 * differs is forced by the platform rather than chosen:
 *
 *  - The web file imports `@revenuecat/purchases-js` dynamically so a learner who never opens the
 *    pricing page never downloads it. There is no equivalent win here — Metro bundles the whole
 *    graph ahead of time and `react-native-purchases` is a native module linked into the binary
 *    either way — so the import is static and plain.
 *  - `changeUser` is `logIn` here, and `isConfigured()` is async.
 *  - Prices come off `product.priceString` rather than `webBillingProduct.price.formattedPrice`.
 *
 * This lives outside `src/billing` deliberately. That directory is in `SYNCED_ONLY_DIRS` in
 * scripts/sync-engines.mjs — every file in it is a byte-for-byte copy of a web source, and
 * anything else is reported as an orphan. This file has no web source and never will.
 *
 * The App User ID is the Supabase user id, exactly as on the web. That is what lets the webhook
 * in supabase/functions/revenuecat-webhook join `app_user_id` straight onto `profiles.id` with no
 * mapping table, and what makes one subscription follow a learner from the browser to the phone.
 */

/** The entitlement the whole product hangs off. Matches supabase/functions/_shared/revenuecat.ts. */
export const ENTITLEMENT_ID = 'full_access';

const apiKey = revenueCatApiKey;

/** False until a key is set — the pricing page then shows fallback prices and says why. */
export const isRevenueCatConfigured = Boolean(apiKey);

/** The user the SDK was configured for, so a second sign-in switches rather than re-configures. */
let configuredFor: string | null = null;

async function sdk(appUserId: string): Promise<void> {
  if (configuredFor === appUserId) return;

  if (await Purchases.isConfigured()) {
    // Configuring twice is not supported; a learner who signs out and back in as someone else
    // needs their purchases to follow the new account.
    await Purchases.logIn(appUserId);
    configuredFor = appUserId;
    return;
  }

  // `store` is left unset: the SDK picks the App Store on iOS and Play on Android, and a Test
  // Store key routes itself. Platform is only consulted for which key to hand it — see env.ts.
  Purchases.configure({ apiKey: apiKey as string, appUserID: appUserId });
  configuredFor = appUserId;
}

/** Forget the configured user, so the next sign-in reconfigures. Called on sign-out. */
export async function logOutOfRevenueCat(): Promise<void> {
  if (!isRevenueCatConfigured || configuredFor === null) return;
  configuredFor = null;
  try {
    if (await Purchases.isConfigured()) await Purchases.logOut();
  } catch {
    // Signing out of the app must not fail because the purchase SDK objected.
  }
}

/** A package as the pricing screen needs it, alongside the object required to buy it. */
export interface OfferedPackage extends PlanPackage {
  rcPackage: PurchasesPackage;
}

/**
 * The current offering, mapped onto the shape the pricing screen renders.
 *
 * Returns null rather than throwing when RevenueCat is unconfigured or unreachable — the caller
 * falls back to `FALLBACK_PACKAGES`, because a pricing screen that renders nothing is worse than
 * one showing last known prices.
 */
export async function fetchOfferedPackages(appUserId: string): Promise<OfferedPackage[] | null> {
  if (!isRevenueCatConfigured) return null;

  try {
    await sdk(appUserId);
    const current = (await Purchases.getOfferings()).current;
    if (!current) return null;

    const mapped = current.availablePackages
      .map((rcPackage) => {
        const fallback = FALLBACK_PACKAGES.find((plan) => plan.id === rcPackage.identifier);
        if (!fallback) return null;

        return {
          ...fallback,
          // The dashboard is the source of truth for price and currency, and the store localises.
          price: rcPackage.product.priceString || fallback.price,
          rcPackage,
        } satisfies OfferedPackage;
      })
      .filter((entry): entry is OfferedPackage => entry !== null);

    return mapped.length > 0 ? mapped : null;
  } catch {
    return null;
  }
}

export type PurchaseOutcome =
  | { ok: true }
  | { cancelled: true }
  | { ok: false; message: string };

const hasEntitlement = (info: CustomerInfo): boolean =>
  info.entitlements.active[ENTITLEMENT_ID] !== undefined;

export async function purchasePackage(
  appUserId: string,
  rcPackage: PurchasesPackage,
): Promise<PurchaseOutcome> {
  try {
    await sdk(appUserId);
    await Purchases.purchasePackage(rcPackage);
    return { ok: true };
  } catch (error) {
    // Closing the sheet arrives as an error and is not one. The web SDK signals this with an
    // error code; the native one puts a flag on the error itself.
    if ((error as PurchasesError)?.userCancelled) return { cancelled: true };
    return {
      ok: false,
      message:
        (error as Error)?.message ??
        'The payment could not be completed. Nothing has been charged — try again in a moment.',
    };
  }
}

/**
 * Hand back a purchase made on another device, or before a reinstall.
 *
 * Both stores require this to exist somewhere a buyer can reach it, and it is the honest answer
 * to "I already paid for this" — resolves to whether full access is now active.
 */
export async function restorePurchases(appUserId: string): Promise<boolean> {
  if (!isRevenueCatConfigured) return false;
  try {
    await sdk(appUserId);
    return hasEntitlement(await Purchases.restorePurchases());
  } catch {
    return false;
  }
}

/**
 * Whether RevenueCat itself believes this learner has full access.
 *
 * Read on top of the Supabase answer rather than instead of it — see useNativeEntitlement.
 */
export async function hasActiveEntitlement(appUserId: string): Promise<boolean> {
  if (!isRevenueCatConfigured) return false;
  try {
    await sdk(appUserId);
    return hasEntitlement(await Purchases.getCustomerInfo());
  } catch {
    return false;
  }
}
