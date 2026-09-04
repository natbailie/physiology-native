import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FALLBACK_PACKAGES, PLAN_FEATURES, PLAN_NAME } from '../src/billing/config';
import { useEntitlement } from '../src/billing/useEntitlement';
import { redeemLicence } from '../src/billing/licence';
import { useAuth } from '../src/auth/AuthContext';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../src/presentation/theme';

/**
 * What full access costs, what it includes, and how to redeem an institutional seat.
 *
 * Prices come from the file-synced billing config, and entitlement state from the synced
 * useEntitlement, which reads it from Supabase rather than from RevenueCat — which is why both
 * cross over unchanged.
 *
 * There is deliberately no Buy button. Apple and Google require in-app purchase for digital
 * goods, so buying here means RevenueCat's NATIVE SDK (react-native-purchases), which is a native
 * module and therefore needs a development build rather than Expo Go. Shipping a button that
 * cannot complete would be worse than saying where to buy. Redemption is unaffected: it is a
 * Supabase rpc, so it works today.
 */
export default function PricingScreen() {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const entitlement = useEntitlement();
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Which of the two the message is, so it can be coloured rather than all rendered as an error.
  const [redeemed, setRedeemed] = useState(false);

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
        {entitlement.status === 'active' ? (
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

      <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
        <Text style={[styles.heading, { color: color.text }]}>Price</Text>
        {FALLBACK_PACKAGES.map((pkg) => (
          <View key={pkg.id} style={styles.priceRow}>
            <Text style={[styles.body, { color: color.textDim }]}>{pkg.label}</Text>
            <Text style={[styles.price, { color: color.text }]}>
              {pkg.price}
              <Text style={[styles.period, { color: color.textFaint }]}> / {pkg.period}</Text>
              {pkg.note ? <Text style={[styles.note, { color: color.ok }]}>  {pkg.note}</Text> : null}
            </Text>
          </View>
        ))}
        <Text style={[styles.footnote, { color: color.textFaint }]}>
          Subscriptions are bought on the web app for now. This build does not include the in-app
          purchase SDK, and buying digital goods in an iOS or Android app has to go through one.
        </Text>
      </View>

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
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
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
  primary: {
    minHeight: TAP,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { fontSize: FONT.base, fontWeight: '700' },
  message: { fontSize: FONT.xs, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
