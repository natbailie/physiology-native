import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthContext';
import { logOutOfRevenueCat } from '../../src/purchases/revenuecat';
import { useNativeEntitlement } from '../../src/purchases/useNativeEntitlement';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { useModuleProgress } from '../../src/home/useModuleProgress';
import { useProgressStore } from '../../src/shared/assessment/useProgressStore';
import { ThemeToggle } from '../../src/presentation/ThemeToggle';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';

/**
 * Sign in, what signing in is for, and what it currently buys.
 *
 * The whole screen tolerates an unconfigured backend, the way the web app does: with no
 * EXPO_PUBLIC_SUPABASE_* set, `isSupabaseConfigured` is false and this says so plainly rather than
 * offering a form that cannot work. Progress still works in that state — it is simply on-device.
 *
 * Two additions over the version this replaces, both mirroring the web's AccountPage: the
 * appearance control, which is reachable WITHOUT a session because the theme is a device
 * preference rather than account data; and the access summary, which names which of the two
 * revenue streams is paying. That last one is worth saying out loud rather than just showing a
 * padlock or not — a student whose school has bought a seat may also be paying us themselves, and
 * has no way to discover that unless we tell them.
 */
export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  const { user, initialising, signIn, signUp, signOut } = useAuth();
  const { totals } = useModuleProgress();
  const store = useProgressStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
    } else if (result.needsConfirmation) {
      setMessage('Check your email to confirm the account, then sign in.');
    }
  };

  const confirmReset = () => {
    Alert.alert('Reset progress?', 'This clears every answer and your streak. There is no undo.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => store.reset() },
    ]);
  };

  const disabled = busy || email === '' || password === '';

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Account' }} />

      <Card>
        <Heading>Appearance</Heading>
        <ThemeToggle />
      </Card>

      <Card>
        <Heading>Access</Heading>
        <AccessSummary />
        <GhostButton label="Full access & institutional codes" onPress={() => router.push('/pricing')} />
      </Card>

      <Card>
        <Heading>Progress</Heading>
        <Body>
          {totals.attempted} answered · {totals.known} of {totals.totalQuestions} known ·{' '}
          {store.streak()}-day streak
        </Body>
        <GhostButton label="Reset progress" onPress={confirmReset} destructive />
      </Card>

      {!isSupabaseConfigured ? (
        <Card>
          <Heading>Accounts are off</Heading>
          <Body>
            This build has no Supabase credentials, so there is nothing to sign in to. Progress is
            kept on this device.
          </Body>
        </Card>
      ) : initialising ? (
        <ActivityIndicator color={color.brand} />
      ) : user ? (
        <Card>
          <Heading>Signed in</Heading>
          <Body>{user.email}</Body>
          <Body>
            Progress syncs to your account, so it follows you between the web app and this one.
          </Body>
          <GhostButton
            label="Sign out"
            // RevenueCat holds the signed-in learner too, and a shared device must not leave the
            // next one holding the last one's purchases.
            onPress={() => void logOutOfRevenueCat().then(signOut)}
          />
        </Card>
      ) : (
        <Card>
          <Heading>{mode === 'signIn' ? 'Sign in' : 'Create an account'}</Heading>
          <Body>
            Signing in syncs your progress, so your streak and review schedule follow you between
            devices.
          </Body>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={color.textFaint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={color.textFaint}
            autoCapitalize="none"
            secureTextEntry
            textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
            onSubmitEditing={() => !disabled && void submit()}
            style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
          />
          {message && <Text style={[styles.message, { color: color.danger }]}>{message}</Text>}
          <Pressable
            onPress={() => void submit()}
            disabled={disabled}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: color.brand },
              disabled && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.primaryText, { color: color.onSolid }]}>
              {busy ? 'Working…' : mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
          <GhostButton
            label={mode === 'signIn' ? 'Create an account instead' : 'I already have an account'}
            onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          />
        </Card>
      )}
    </ScrollView>
  );
}

/** Which of the two revenue streams is paying for this learner. Ported from the web's
 *  AccessSummary — quietly taking both a school's money and a student's is not a thing this
 *  product should do, and the only way they find out is if we say so. */
function AccessSummary() {
  const { status, source, institutionName } = useNativeEntitlement();
  const { color } = useAppTheme();

  if (status === 'loading') return <Body>Checking your access…</Body>;
  if (status === 'free') {
    return <Body>Free account — the three free simulators and the reference pages.</Body>;
  }
  if (source === 'institution') {
    return (
      <>
        <Text style={[styles.active, { color: color.ok }]}>
          Full access, covered by {institutionName ?? 'your institution'}
        </Text>
        <Body>
          If you are also paying for a personal subscription you can cancel it — this does not
          depend on it.
        </Body>
      </>
    );
  }
  if (source === 'subscription') {
    return <Text style={[styles.active, { color: color.ok }]}>Full access through your own subscription.</Text>;
  }
  return <Text style={[styles.active, { color: color.ok }]}>Full access.</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      {children}
    </View>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return <Text style={[styles.heading, { color: color.text }]}>{children}</Text>;
}

function Body({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return <Text style={[styles.body, { color: color.textDim }]}>{children}</Text>;
}

function GhostButton({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { color } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
    >
      <Text style={[styles.ghostText, { color: destructive ? color.danger : color.brand }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACE.xl, gap: SPACE.lg },
  card: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.xl, gap: SPACE.md },
  heading: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  body: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  active: { fontSize: FONT.sm, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.lg,
    minHeight: TAP,
    fontSize: FONT.base,
  },
  primary: {
    minHeight: TAP,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  primaryText: { fontSize: FONT.base, fontWeight: '700' },
  ghost: { minHeight: TAP, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontSize: FONT.sm, fontWeight: '700' },
  message: { fontSize: FONT.xs },
  pressed: { opacity: 0.6 },
});
