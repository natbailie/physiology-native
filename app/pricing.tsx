import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FALLBACK_PACKAGES, PLAN_FEATURES, PLAN_NAME, type PlanPackage } from '../src/billing/config';
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
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../src/presentation/theme';

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

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Which of the two the message is, so it can be coloured rather than all rendered as an error.
  const [redeemed, setRedeemed] = useState(false);

  // Keyed by the learner it was fetched for, so both "still loading" and "signed out" are
  // derived rather than written by an effect that would only cause a second render.
  const [offer, setOffer] = useState<{ userId: string; packages: OfferedPackage[] | null } | null>(null);
  const [selectedId, setSelectedId] = useState<PlanPackage['id']>('$rc_annual');
  const [buying, setBuying] = useState(false);
  const [buyMessage, setBuyMessage] = useState<string | null>(null);

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
  }, [user]);

  // What to render prices from: the live offering when there is one, last known prices otherwise.
  const shown: readonly PlanPackage[] = offered ?? FALLBACK_PACKAGES;
  const canBuy = Boolean(user) && offered !== null && !active;

  const buy = async () => {
    const chosen = offered?.find((pkg) => pkg.id === selectedId);
    if (!user || !chosen) return;

    setBuying(true);
    setBuyMessage(null);
    const outcome = await purchasePackage(user.id, chosen.rcPackage);
    setBuying(false);

    if ('cancelled' in outcome) return;
    if (!outcome.ok) {
      setBuyMessage(outcome.message);
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
    setBuyMessage(
      restored ? null : 'No previous purchase was found on this account.',
    );
  };

  const redeem = async () => {
    setBusy(true);
    setMessage(null);
    const result = await redeemLicence(code);
    setBusy(false);
    setRedeemed(result.ok);
    setMessage(result.ok ? 'Redeemed — full access is on this account.' : result.message);
    if (result.ok) setCode('');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: color.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Full access' }} />

      <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
        <Text style={[styles.heading, { color: color.text }]}>{PLAN_NAME}</Text>
        {active ? (
          <Text style={[styles.active, { color: color.ok }]}>
            Active
            {entitlement.institutionName ? ` — via ${entitlement.institutionName}` : ''}
          </Text>
        ) : (
          <Text style={[styles.body, { color: color.textDim }]}>
            Three systems are free. Full access opens the rest.
          </Text>
        )}
        {PLAN_FEATURES.map((feature) => (
          <Text key={feature} style={[styles.feature, { color: color.textDim }]}>
            · {feature}
          </Text>
        ))}
      </View>

      {!active && (
        <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
          <Text style={[styles.heading, { color: color.text }]}>Price</Text>

          {loadingOffer ? (
            <ActivityIndicator color={color.textDim} style={styles.spinner} />
          ) : (
            shown.map((pkg) => {
              const selected = canBuy && pkg.id === selectedId;
              return (
                <Pressable
                  key={pkg.id}
                  onPress={() => setSelectedId(pkg.id)}
                  disabled={!canBuy}
                  accessibilityRole={canBuy ? 'radio' : 'text'}
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${pkg.label}, ${pkg.price} per ${pkg.period}`}
                  style={({ pressed }) => [
                    styles.priceRow,
                    canBuy && styles.priceRowSelectable,
                    canBuy && { borderColor: selected ? color.brand : color.panelBorder },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.body, { color: color.textDim }]}>{pkg.label}</Text>
                  <Text style={[styles.price, { color: color.text }]}>
                    {pkg.price}
                    <Text style={[styles.period, { color: color.textFaint }]}> / {pkg.period}</Text>
                    {pkg.note ? <Text style={[styles.note, { color: color.ok }]}>  {pkg.note}</Text> : null}
                  </Text>
                </Pressable>
              );
            })
          )}

          {buyMessage && (
            <Text style={[styles.message, { color: color.danger }]}>{buyMessage}</Text>
          )}

          {canBuy && (
            <>
              <Pressable
                onPress={() => void buy()}
                disabled={buying}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.primary,
                  { backgroundColor: color.brand },
                  buying && styles.primaryDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.primaryText, { color: color.onSolid }]}>
                  {buying ? 'One moment…' : 'Subscribe'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void restore()}
                disabled={buying}
                accessibilityRole="button"
                style={({ pressed }) => [styles.restore, pressed && styles.pressed]}
              >
                <Text style={[styles.restoreText, { color: color.textDim }]}>Restore purchases</Text>
              </Pressable>
            </>
          )}

          {!user && (
            <Text style={[styles.footnote, { color: color.textFaint }]}>
              Sign in to subscribe — a subscription follows the account, not the device, so it works
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
        </View>
      )}

      {isSupabaseConfigured && (
        <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
          <Text style={[styles.heading, { color: color.text }]}>Institutional code</Text>
          <Text style={[styles.body, { color: color.textDim }]}>
            If your school has bought seats, redeem your code here.
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="ABCD-EFGH-JK"
            placeholderTextColor={color.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            // The alphabet these are minted from has no lookalikes, so a code is read off a slide
            // and typed straight back in; `normaliseLicenceCode` strips whatever punctuation the
            // learner adds to make it readable.
            spellCheck={false}
            returnKeyType="go"
            onSubmitEditing={() => !(busy || code.trim() === '' || !user) && void redeem()}
            style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
          />
          {message && (
            <Text style={[styles.message, { color: redeemed ? color.ok : color.danger }]}>{message}</Text>
          )}
          <Pressable
            onPress={() => void redeem()}
            disabled={busy || code.trim() === '' || !user}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: color.brand },
              (busy || code.trim() === '' || !user) && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.primaryText, { color: color.onSolid }]}>
              {!user ? 'Sign in to redeem' : busy ? 'Redeeming…' : 'Redeem'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.xl, gap: SPACE.lg },
  card: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.xl, gap: SPACE.md },
  heading: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  body: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  feature: { fontSize: FONT.xs, lineHeight: FONT.xs * LINE.prose },
  active: { fontSize: FONT.sm, fontWeight: '700' },
  spinner: { alignSelf: 'flex-start' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  // Only a selectable row gets a box round it; with nothing to buy the prices stay plain text.
  priceRowSelectable: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    minHeight: TAP,
    alignItems: 'center',
  },
  price: { fontSize: FONT.lg, fontWeight: '700' },
  period: { fontSize: FONT.xs, fontWeight: '400' },
  note: { fontSize: FONT.micro, fontWeight: '700' },
  footnote: { fontSize: FONT.micro, lineHeight: FONT.micro * LINE.prose, marginTop: SPACE.xs },
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
});
