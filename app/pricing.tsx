import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { FALLBACK_PACKAGES, PLAN_FEATURES, PLAN_NAME } from '../src/billing/config';
import { useEntitlement } from '../src/billing/useEntitlement';
import { redeemLicence } from '../src/billing/licence';
import { useAuth } from '../src/auth/AuthContext';
import { isSupabaseConfigured } from '../src/lib/supabase';

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
  const isDark = useColorScheme() === 'dark';
  const entitlement = useEntitlement();
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const redeem = async () => {
    setBusy(true);
    setMessage(null);
    const result = await redeemLicence(code);
    setBusy(false);
    setMessage(result.ok ? 'Redeemed — full access is on this account.' : result.message);
    if (result.ok) setCode('');
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Full access' }} />

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.heading, isDark && styles.textLight]}>{PLAN_NAME}</Text>
        {entitlement.status === 'active' ? (
          <Text style={styles.active}>
            Active
            {entitlement.institutionName ? ` — via ${entitlement.institutionName}` : ''}
          </Text>
        ) : (
          <Text style={[styles.body, isDark && styles.bodyDark]}>
            Three systems are free. Full access opens the rest.
          </Text>
        )}
        {PLAN_FEATURES.map((feature) => (
          <Text key={feature} style={[styles.feature, isDark && styles.bodyDark]}>
            · {feature}
          </Text>
        ))}
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.heading, isDark && styles.textLight]}>Price</Text>
        {FALLBACK_PACKAGES.map((pkg) => (
          <View key={pkg.id} style={styles.priceRow}>
            <Text style={[styles.body, isDark && styles.bodyDark]}>{pkg.label}</Text>
            <Text style={[styles.price, isDark && styles.textLight]}>
              {pkg.price}
              <Text style={styles.period}> / {pkg.period}</Text>
              {pkg.note ? <Text style={styles.note}>  {pkg.note}</Text> : null}
            </Text>
          </View>
        ))}
        <Text style={[styles.footnote, isDark && styles.bodyDark]}>
          Subscriptions are bought on the web app for now. This build does not include the in-app
          purchase SDK, and buying digital goods in an iOS or Android app has to go through one.
        </Text>
      </View>

      {isSupabaseConfigured && (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.heading, isDark && styles.textLight]}>Institutional code</Text>
          <Text style={[styles.body, isDark && styles.bodyDark]}>
            If your school has bought seats, redeem your code here.
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="CODE-1234"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, isDark && styles.inputDark]}
          />
          {message && <Text style={styles.message}>{message}</Text>}
          <Pressable
            onPress={redeem}
            disabled={busy || code.trim() === '' || !user}
            style={({ pressed }) => [
              styles.primary,
              (busy || code.trim() === '' || !user) && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>
              {!user ? 'Sign in to redeem' : busy ? 'Redeeming…' : 'Redeem'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, gap: 8 },
  cardDark: { backgroundColor: '#1e293b' },
  heading: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  body: { fontSize: 14, lineHeight: 21, color: '#475569' },
  bodyDark: { color: '#cbd5e1' },
  textLight: { color: '#e2e8f0' },
  feature: { fontSize: 13, lineHeight: 20, color: '#475569' },
  active: { fontSize: 14, fontWeight: '600', color: '#059669' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  price: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  period: { fontSize: 13, fontWeight: '400', color: '#94a3b8' },
  note: { fontSize: 12, fontWeight: '600', color: '#059669' },
  footnote: { fontSize: 12, lineHeight: 18, color: '#64748b', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  inputDark: { borderColor: '#334155', color: '#e2e8f0' },
  primary: { backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  message: { fontSize: 13, color: '#475569' },
  pressed: { opacity: 0.6 },
});
