import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTO_RENEW_DISCLOSURE,
  FALLBACK_PACKAGES,
  PLAN_FEATURES,
  PLAN_NAME,
  type PlanPackage,
} from '../src/billing/config';
import { confirmSubscription } from '../src/billing/useEntitlement';
import { redeemLicence } from '../src/billing/licence';
import {
  fetchOfferedPackages,
  isRevenueCatConfigured,
  type OfferedPackage,
  purchasePackage,
  restorePurchases,
} from '../src/purchases/revenuecat';
import { invalidateStoreEntitlement, useNativeEntitlement } from '../src/purchases/useNativeEntitlement';
import { useAuth } from '../src/auth/AuthContext';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { RetryButton } from '../src/presentation/RetryButton';
import { Button } from '../src/presentation/ui/Button';
import { FormField } from '../src/presentation/ui/FormField';
import { GradientBox } from '../src/presentation/ui/GradientBox';
import { Illustration } from '../src/presentation/ui/Illustration';
import { Skeleton } from '../src/presentation/ui/Skeleton';
import { KeyboardAwareScroll } from '../src/presentation/KeyboardAwareScroll';
import { FONT, LINE, RADIUS, SHADOW, SPACE, TAP, TRACKING_TIGHT, useAppTheme, withAlpha } from '../src/presentation/theme';

/**
 * The store-billing half of the pre-purchase disclosure. App Store Review Guideline 3.1.2 wants
 * the renewal terms, where the charge lands and how to cancel stated before the purchase button,
 * with working links to the Terms (EULA) and the privacy policy; Google Play's subscription policy
 * asks the same. The price-and-renewal sentence itself is `AUTO_RENEW_DISCLOSURE`, shared with the
 * website so the two cannot describe the contract differently.
 */
const STORE_BILLING =
  Platform.OS === 'ios'
    ? 'Payment is charged to your Apple ID at confirmation of purchase. The subscription renews automatically unless it is cancelled at least 24 hours before the end of the current period, and your account is charged for the renewal within the 24 hours before that. Manage or cancel in Settings › your name › Subscriptions.'
    : 'Payment is charged to your Google Play account at confirmation of purchase. The subscription renews automatically unless it is cancelled before the end of the current period. Manage or cancel in Google Play › Payments & subscriptions › Subscriptions.';

/** An error is said in words as well as in red, and announced — VoiceOver does not read text that
 * appears under a button the learner is still focused on. */
function announce(text: string, error: boolean) {
  AccessibilityInfo.announceForAccessibility(error ? `Error: ${text}` : text);
}

/**
 * What full access costs, how to buy it, and how to redeem an institutional seat.
 *
 * Prices are read from the RevenueCat offering and fall back to the synced billing config when
 * the SDK is unconfigured, unreachable, or still loading — the same three-state discipline the
 * web project's PricingPage keeps, and for the same reason: a pricing screen that renders nothing
 * is worse than one showing last known prices.
 *
 * Buying goes through RevenueCat's native SDK, which is what puts the purchase in front of
 * StoreKit or Play Billing as both stores require for digital goods. Redemption sits beside it
 * unchanged — it is a Supabase rpc and has always worked here.
 */
export default function PricingScreen() {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const entitlement = useNativeEntitlement();
  const { user } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Which of the two the message is, so it can be coloured rather than all rendered as an error.
  const [redeemed, setRedeemed] = useState(false);

  // Keyed by the learner it was fetched for, so both "still loading" and "signed out" are
  // derived rather than written by an effect that would only cause a second render.
  const [offer, setOffer] = useState<{ userId: string; packages: OfferedPackage[] | null } | null>(null);
  const [selectedId, setSelectedId] = useState<PlanPackage['id']>('$rc_annual');
  // Bumped by Retry to fetch the offering again.
  const [offerAttempt, setOfferAttempt] = useState(0);
  const [buying, setBuying] = useState(false);
  const [buyMessage, setBuyMessage] = useState<string | null>(null);
  // The school-code form is a side door, so it stays folded until asked for (or until it has news).
  const [codeOpen, setCodeOpen] = useState(false);

  const active = entitlement.status === 'active';

  const offered = offer !== null && offer.userId === user?.id ? offer.packages : null;
  const loadingOffer = isRevenueCatConfigured && Boolean(user) && offer?.userId !== user?.id;

  useEffect(() => {
    if (!isRevenueCatConfigured || !user) return;

    let cancelled = false;
    const userId = user.id;
    void fetchOfferedPackages(userId).then((packages) => {
      if (!cancelled) setOffer({ userId, packages });
    });
    return () => {
      cancelled = true;
    };
  }, [user, offerAttempt]);

  // What to render prices from: the live offering when there is one, last known prices otherwise.
  const shown: readonly PlanPackage[] = offered ?? FALLBACK_PACKAGES;
  const canBuy = Boolean(user) && offered !== null && !active;

  const buy = async () => {
    const chosen = offered?.find((pkg) => pkg.id === selectedId) ?? offered?.[0];
    if (!user || !chosen) return;

    setBuying(true);
    setBuyMessage(null);
    const outcome = await purchasePackage(user.id, chosen.rcPackage);
    setBuying(false);

    if ('cancelled' in outcome) return;
    if (!outcome.ok) {
      setBuyMessage(outcome.message);
      announce(outcome.message, true);
      return;
    }

    // The store has the money and the receipt says so, which is enough to open the app now.
    invalidateStoreEntitlement();
    // Reconcile with the webhook in the background so the entitlement outlives this install.
    void confirmSubscription(user.id);
  };

  const restore = async () => {
    if (!user) return;
    setBuying(true);
    setBuyMessage(null);
    const restored = await restorePurchases(user.id);
    setBuying(false);
    invalidateStoreEntitlement();
    const text = restored ? null : 'No previous purchase was found on this account.';
    setBuyMessage(text);
    announce(text ?? 'Purchases restored.', text !== null);
  };

  const redeem = async () => {
    setBusy(true);
    setMessage(null);
    const result = await redeemLicence(code);
    setBusy(false);
    setRedeemed(result.ok);
    const text = result.ok ? 'Redeemed. Full access is on this account.' : result.message;
    setMessage(text);
    announce(text, !result.ok);
    if (result.ok) setCode('');
  };

  return (
    /* The licence code field is the LAST card on this screen, so the keyboard covered it
       outright — the one place in the app where a learner has to read characters back as they
       type them. See KeyboardAwareScroll. */
    <KeyboardAwareScroll
      style={[styles.container, { backgroundColor: color.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: 'Full access' }} />

      {/* The offer, on the brand gradient. The feature card below rides up over its bottom edge. */}
      <GradientBox colors={[color.brandInk, color.brandDeep]} style={styles.hero}>
        <View style={styles.heroText}>
          <Text accessibilityRole="header" style={[styles.heroTitle, { color: color.onBrandInk }]}>
            {PLAN_NAME}
          </Text>
          {active ? (
            <Text style={[styles.heroBody, { color: color.brandOnInk }]}>
              You are all set{entitlement.institutionName ? `, courtesy of ${entitlement.institutionName}` : ''}.
              Every simulator is open.
            </Text>
          ) : (
            <Text style={[styles.heroBody, { color: color.brandInkDim }]}>
              Three systems are free on any account. Full access opens everything else.
            </Text>
          )}
        </View>
        <Illustration kind="access" size={96} />
      </GradientBox>

      <View
        style={[
          styles.card,
          styles.overlap,
          SHADOW.raised,
          { backgroundColor: color.panel, borderColor: color.panelBorder },
        ]}
      >
        {PLAN_FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={[styles.tick, { backgroundColor: color.brand }]}>
              <Text style={[styles.tickText, { color: color.onSolid }]}>✓</Text>
            </View>
            <Text style={[styles.feature, { color: color.text }]}>{feature}</Text>
          </View>
        ))}
      </View>

      {!active && (
        <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
          <Text accessibilityRole="header" style={[styles.heading, { color: color.text }]}>Choose your plan</Text>

          {loadingOffer ? (
            // Two plan tiles' worth of placeholder, so the card keeps its height while prices arrive.
            <View accessibilityLabel="Loading prices" accessibilityLiveRegion="polite" style={styles.skeletons}>
              <Skeleton height={76} style={{ borderRadius: RADIUS.md }} />
              <Skeleton height={76} style={{ borderRadius: RADIUS.md }} />
            </View>
          ) : (
            shown.map((pkg) => {
              // Falls back to the first package when the preferred one is not in the offering, so
              // the highlighted row is always the one Subscribe will buy.
              const effectiveId = shown.some((p) => p.id === selectedId) ? selectedId : shown[0]?.id;
              const selected = canBuy && pkg.id === effectiveId;
              return (
                <Pressable
                  key={pkg.id}
                  onPress={() => setSelectedId(pkg.id)}
                  disabled={!canBuy}
                  accessibilityRole={canBuy ? 'radio' : 'text'}
                  accessibilityState={canBuy ? { checked: selected } : undefined}
                  accessibilityLabel={`${pkg.label}, ${pkg.price} per ${pkg.period}`}
                  style={({ pressed }) => [
                    styles.priceRow,
                    styles.priceRowSelectable,
                    {
                      borderColor: selected ? color.select : color.panelBorder,
                      backgroundColor: selected ? withAlpha(color.select, 0.1) : color.panelRaised,
                      borderWidth: selected ? 2 : 1,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  {pkg.id === '$rc_annual' && (
                    <View style={[styles.badge, { backgroundColor: color.select }]}>
                      <Text style={[styles.badgeText, { color: color.onSolid }]}>Best value</Text>
                    </View>
                  )}
                  <View style={styles.priceLine}>
                    <Text style={[styles.body, { color: color.textDim }]}>{pkg.label}</Text>
                    <Text style={[styles.price, { color: color.text }]}>
                      {pkg.price}
                      <Text style={[styles.period, { color: color.textFaint }]}> / {pkg.period}</Text>
                    </Text>
                  </View>
                  {/* On its own line: inline it was wider than the row on any phone and spilled
                      past the box. */}
                  {pkg.note ? <Text style={[styles.note, { color: color.textDim }]}>{pkg.note}</Text> : null}
                </Pressable>
              );
            })
          )}

          {/* Before the button, and whether or not the button is showing: the terms of the
              subscription are shown wherever its price is. */}
          {!loadingOffer && (
            <View style={styles.disclosure}>
              <Text style={[styles.footnote, { color: color.textDim }]}>
                {(() => {
                  const chosen = shown.find((pkg) => pkg.id === selectedId) ?? shown[0];
                  return chosen ? `${PLAN_NAME}: ${chosen.price} per ${chosen.period}. ` : '';
                })()}
                {AUTO_RENEW_DISCLOSURE}
              </Text>
              <Text style={[styles.footnote, { color: color.textDim }]}>{STORE_BILLING}</Text>
              <View style={styles.legalLinks}>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => router.push('/legal/terms')}
                  style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}
                >
                  <Text style={[styles.legalLinkText, { color: color.brand }]}>Terms of use</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => router.push('/legal/privacy')}
                  style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}
                >
                  <Text style={[styles.legalLinkText, { color: color.brand }]}>Privacy policy</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => router.push('/legal/refunds')}
                  style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}
                >
                  <Text style={[styles.legalLinkText, { color: color.brand }]}>Refunds</Text>
                </Pressable>
              </View>
            </View>
          )}

          {buyMessage && (
            <View accessibilityLiveRegion="polite" style={styles.problem}>
              <View style={[styles.problemMark, { backgroundColor: color.danger }]}>
                <Text style={[styles.problemMarkText, { color: color.onSolid }]}>!</Text>
              </View>
              <Text style={[styles.message, styles.problemText, { color: color.danger }]}>
                Error: {buyMessage}
              </Text>
            </View>
          )}

          {canBuy && (
            <Button
              label="Subscribe (renews automatically)"
              loading={buying}
              onPress={() => void buy()}
            />
          )}

          {/* Always reachable, not only when an offering loaded: a learner reinstalling on a
              flaky connection is exactly who needs it (Guideline 3.1.1). Purchases follow the
              account, so signed out it leads to sign-in first. */}
          <Button
            variant="ghost"
            label={user ? 'Restore purchases' : 'Sign in to restore purchases'}
            disabled={buying}
            onPress={() => (user ? void restore() : router.push('/account'))}
          />

          {!user && (
            <Text style={[styles.footnote, { color: color.textFaint }]}>
              Sign in to subscribe. A subscription follows the account, not the device, so it works
              on the web app too.
            </Text>
          )}
          {user && !loadingOffer && offered === null && (
            <Text style={[styles.footnote, { color: color.textFaint }]}>
              {isRevenueCatConfigured
                ? 'Prices could not be loaded just now, so the last known ones are shown. Try again in a moment.'
                : 'Payments are not configured on this build, so the prices above are indicative.'}
            </Text>
          )}
          {user && !loadingOffer && offered === null && isRevenueCatConfigured && (
            <RetryButton
              label="Retry loading prices"
              onPress={() => {
                setOffer(null);
                setOfferAttempt((n) => n + 1);
              }}
            />
          )}
        </View>
      )}

      {isSupabaseConfigured && (
        <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: codeOpen || Boolean(message) }}
            onPress={() => setCodeOpen(!codeOpen)}
            style={styles.codeToggle}
          >
            <View style={styles.codeToggleText}>
              <Text accessibilityRole="header" style={[styles.heading, { color: color.text }]}>
                Got a code from your school?
              </Text>
              <Text style={[styles.body, { color: color.textDim }]}>
                If your university or hospital has bought seats, redeem your code here.
              </Text>
            </View>
            <Text style={[styles.chevron, { color: color.textFaint }]}>{codeOpen || message ? '˄' : '˅'}</Text>
          </Pressable>

          {(codeOpen || message) && (
            <>
              <FormField
                layout="stacked"
                label="Institutional code"
                value={code}
                onChangeText={setCode}
                placeholder="ABCD-EFGH-JK"
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                // The alphabet these are minted from has no lookalikes, so a code is read off a
                // slide and typed straight back in; `normaliseLicenceCode` strips whatever
                // punctuation the learner adds to make it readable.
                spellCheck={false}
                accessibilityHint="The code your school or university gave you"
                returnKeyType="go"
                onSubmitEditing={() => !(busy || code.trim() === '' || !user) && void redeem()}
                error={message && !redeemed ? message : null}
              />
              {message && redeemed && (
                <Text accessibilityLiveRegion="polite" style={[styles.message, { color: color.ok }]}>
                  {message}
                </Text>
              )}
              <Button
                label={!user ? 'Sign in to redeem' : 'Redeem code'}
                loading={busy}
                disabled={code.trim() === '' || !user}
                onPress={() => void redeem()}
              />
            </>
          )}
        </View>
      )}
    </KeyboardAwareScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.xl, gap: SPACE.xl },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.lg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE.xxl,
    paddingTop: SPACE.xxl,
    paddingBottom: SPACE.xxxl + SPACE.xxl,
  },
  heroText: { flex: 1, gap: SPACE.md },
  heroTitle: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  heroBody: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  // Rides up over the hero's bottom edge, so banner and card read as one object.
  overlap: { marginTop: -(SPACE.xxxl + SPACE.xxl), marginHorizontal: SPACE.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.lg },
  tick: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tickText: { fontSize: FONT.xs, fontWeight: '700' },
  skeletons: { gap: SPACE.lg },
  badge: {
    position: 'absolute',
    top: -12,
    right: SPACE.lg,
    paddingHorizontal: SPACE.lg,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  badgeText: { fontSize: FONT.micro, fontWeight: '700', letterSpacing: 0.4 },
  problem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  problemMark: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  problemMarkText: { fontSize: FONT.micro, fontWeight: '700' },
  problemText: { flex: 1 },
  codeToggle: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg, minHeight: TAP },
  codeToggleText: { flex: 1, gap: SPACE.xs },
  chevron: { fontSize: FONT.lg, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACE.xl, gap: SPACE.lg },
  heading: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  body: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  feature: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  active: { fontSize: FONT.sm, fontWeight: '700' },
  spinner: { alignSelf: 'flex-start' },
  priceRow: { gap: SPACE.xs },
  priceLine: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACE.md },
  // Always a card, so the offer reads the same signed in or out; only a buyable one can be picked.
  priceRowSelectable: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.lg,
    minHeight: 76,
    justifyContent: 'center',
  },
  price: { fontSize: FONT.lg, fontWeight: '700' },
  period: { fontSize: FONT.xs, fontWeight: '400' },
  note: { fontSize: FONT.micro, fontWeight: '700' },
  // `xs`, not `micro`: this now carries the subscription terms, which have to be readable.
  footnote: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose, marginTop: SPACE.xs },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.lg,
    minHeight: TAP,
    fontSize: FONT.lg,
    fontWeight: '600',
    letterSpacing: 2,
  },
  message: { fontSize: FONT.xs, fontWeight: '600' },
  primary: {
    minHeight: TAP,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { fontSize: FONT.base, fontWeight: '700' },
  restore: { minHeight: TAP, alignItems: 'center', justifyContent: 'center' },
  restoreText: { fontSize: FONT.xs, fontWeight: '600' },
  pressed: { opacity: 0.6 },
  disclosure: { gap: SPACE.sm, marginTop: SPACE.xs },
  legalLinks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACE.lg },
  legalLink: { minHeight: TAP, justifyContent: 'center' },
  legalLinkText: { fontSize: FONT.xs, fontWeight: '700', textDecorationLine: 'underline' },
});
