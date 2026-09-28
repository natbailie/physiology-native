import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
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
import { KeyboardAwareScroll } from '../../src/presentation/KeyboardAwareScroll';
import { ThemeToggle } from '../../src/presentation/ThemeToggle';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';
import { BUSINESS, LEGAL_DOC_ORDER, LEGAL_LINK_LABELS, TERMS_VERSION } from '../../src/shared/legal';

/** Where a store subscription is managed. Every phone subscription is a store one. */
const STORE_SUBSCRIPTIONS_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

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
  const { user, initialising, signIn, signUp, signOut, deleteAccount } = useAuth();
  const { totals } = useModuleProgress();
  const store = useProgressStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Said as well as shown: VoiceOver does not read a message that appears under a button the
  // learner is still focused on.
  const say = (text: string, error: boolean) => {
    setMessage({ text, error });
    AccessibilityInfo.announceForAccessibility(error ? `Error: ${text}` : text);
  };

  const submit = async () => {
    if (mode === 'signUp' && !agreed) {
      say('To create an account, confirm you are 18 or over and agree to the Terms.', true);
      return;
    }
    setBusy(true);
    setMessage(null);
    const result =
      mode === 'signIn' ? await signIn(email, password) : await signUp(email, password, TERMS_VERSION);
    setBusy(false);
    if (!result.ok) {
      say(result.message, true);
    } else if (result.needsConfirmation) {
      say('Check your email to confirm the account, then sign in.', false);
    }
  };

  /**
   * Account deletion, in the app — App Store Review Guideline 5.1.1(v) requires it wherever an
   * account can be created, and UK GDPR's right to erasure is easier to honour than to explain.
   * Two steps, like the web, because it is immediate and there is nothing to restore from.
   */
  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This removes your email address, every recorded answer, your classes, your review and your access from our servers straight away. It does not cancel an App Store or Google Play subscription — cancel that in your store settings first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: () =>
            void logOutOfRevenueCat()
              .then(deleteAccount)
              .then((result) => {
                if (result.ok) say('Your account has been deleted.', false);
                else say(result.message, true);
              }),
        },
      ],
    );
  };

  const confirmReset = () => {
    Alert.alert('Reset progress?', 'This clears every answer and your streak. There is no undo.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => store.reset() },
    ]);
  };

  const disabled = busy || email === '' || password === '';
  const passwordRef = useRef<TextInput>(null);

  return (
    /* The sign-in card is the last on the tab, under a header AND over the tab bar, so both
       chrome heights matter. KeyboardAwareScroll lets UIKit work them out. */
    <KeyboardAwareScroll
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
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

      <Card>
        <Heading>Legal and support</Heading>
        {LEGAL_DOC_ORDER.map((id) => (
          <GhostButton
            key={id}
            label={id === 'cookies' ? 'Cookies and storage' : LEGAL_LINK_LABELS[id]}
            onPress={() => router.push(`/legal/${id}`)}
            role="link"
          />
        ))}
        <GhostButton label="Reviews" onPress={() => router.push('/reviews')} role="link" />
        <GhostButton
          label={`Contact us: ${BUSINESS.contactEmail}`}
          onPress={() => void Linking.openURL(`mailto:${BUSINESS.contactEmail}`)}
          role="link"
        />
        <Body>
          Simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
          Not affiliated with or endorsed by any exam body.
        </Body>
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
          <GhostButton label="Delete my account…" onPress={confirmDelete} destructive />
          {message && <Message message={message} />}
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
            accessibilityLabel="Email"
            placeholder="Email"
            placeholderTextColor={color.textFaint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            // Return moves to the password rather than dismissing the keyboard, which is what a
            // two-field form does everywhere else on the platform.
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
          />
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={color.textFaint}
            accessibilityLabel="Password"
            accessibilityHint={mode === 'signUp' ? 'Six characters minimum' : undefined}
            autoCapitalize="none"
            secureTextEntry
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
            returnKeyType="go"
            onSubmitEditing={() => !disabled && void submit()}
            style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
          />
          {mode === 'signUp' && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              accessibilityLabel="I'm 18 or over and I agree to the Terms. I've read the Privacy policy."
              onPress={() => setAgreed(!agreed)}
              style={styles.agreeRow}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: agreed ? color.brand : color.textDim, backgroundColor: agreed ? color.brand : 'transparent' },
                ]}
              >
                {agreed && <Text style={[styles.checkmark, { color: color.onSolid }]}>✓</Text>}
              </View>
              <Text style={[styles.body, styles.agreeText, { color: color.textDim }]}>
                I’m 18 or over and I agree to the Terms. I’ve read the Privacy policy.
              </Text>
            </Pressable>
          )}
          {mode === 'signUp' && (
            <View style={styles.inlineLinks}>
              <GhostButton label="Read the Terms" onPress={() => router.push('/legal/terms')} role="link" />
              <GhostButton label="Read the Privacy policy" onPress={() => router.push('/legal/privacy')} role="link" />
            </View>
          )}
          {message && <Message message={message} />}
          <Pressable
            onPress={() => void submit()}
            disabled={disabled}
            accessibilityState={{ disabled }}
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
    </KeyboardAwareScroll>
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
    return (
      <>
        <Text style={[styles.active, { color: color.ok }]}>Full access through your own subscription.</Text>
        <Body>
          Cancel any time and keep access to the end of the period you have paid for. If you subscribed on
          the website, cancel from the website&apos;s account page instead.
        </Body>
        <GhostButton
          label="Manage or cancel your subscription"
          onPress={() => void Linking.openURL(STORE_SUBSCRIPTIONS_URL)}
          role="link"
        />
      </>
    );
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
  return (
    <Text accessibilityRole="header" style={[styles.heading, { color: color.text }]}>
      {children}
    </Text>
  );
}

/** An error says so in words as well as in red; a confirmation is not painted as an error. */
function Message({ message }: { message: { text: string; error: boolean } }) {
  const { color } = useAppTheme();
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.message, { color: message.error ? color.danger : color.text }]}>
      {message.error ? 'Error: ' : ''}
      {message.text}
    </Text>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return <Text style={[styles.body, { color: color.textDim }]}>{children}</Text>;
}

function GhostButton({
  label,
  onPress,
  destructive = false,
  role = 'button',
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  role?: 'button' | 'link';
}) {
  const { color } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
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
  message: { fontSize: FONT.sm },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, minHeight: TAP },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontSize: FONT.sm, fontWeight: '700' },
  agreeText: { flex: 1 },
  inlineLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.lg },
  pressed: { opacity: 0.6 },
});
