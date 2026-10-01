import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
import { Button } from '../../src/presentation/ui/Button';
import { FormField } from '../../src/presentation/ui/FormField';
import { ProgressBar } from '../../src/presentation/ui/ProgressBar';
import { Skeleton } from '../../src/presentation/ui/Skeleton';
import { ChipSelect } from '../../src/presentation/ui/ChipSelect';
import { ListSelect } from '../../src/presentation/ui/ListSelect';
import { Logo } from '../../src/presentation/ui/Logo';
import { useExamProfile } from '../../src/account/examProfile';
import { setExamFilter } from '../../src/home/examFilter';
import { EXAMS, TRAINING_LEVELS, isExamId, isTrainingLevelId } from '../../src/home/exams';
import {
  DEGREE_TYPES,
  STUDY_YEARS,
  UK_MEDICAL_SCHOOLS,
  isDegreeTypeId,
  isStudyYear,
  isUniversityId,
} from '../../src/home/studyProfile';
import { WEAK_PASSWORD_MESSAGE, isStrongPassword } from '../../src/auth/passwordRules';
import { RetryButton } from '../../src/presentation/RetryButton';
import { ThemeToggle } from '../../src/presentation/ThemeToggle';
import { FONT, LINE, RADIUS, SHADOW, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';
import { BUSINESS, LEGAL_DOC_ORDER, LEGAL_LINK_LABELS, TERMS_VERSION } from '../../src/shared/legal';

/** Deliberately loose: one @, something either side, a dot after it. The server is the authority. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An error is said as well as shown: VoiceOver does not read text that appears under a field the
 *  learner is still focused on. */
function announce(text: string, error: boolean) {
  AccessibilityInfo.announceForAccessibility(error ? `Error: ${text}` : text);
}

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
  // A problem with the form, tagged with the field it is about so it is written beside that field.
  const [problem, setProblem] = useState<{ where: 'email' | 'password' | 'agree'; text: string } | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Said as well as shown: VoiceOver does not read a message that appears under a button the
  // learner is still focused on.
  const say = (text: string, error: boolean) => {
    setMessage({ text, error });
    AccessibilityInfo.announceForAccessibility(error ? `Error: ${text}` : text);
  };

  const submit = async () => {
    setMessage(null);
    // Each problem is written next to the field it is about, in words, rather than as one line
    // under the button that the learner then has to map back to a field.
    const trimmed = email.trim();
    if (trimmed === '') {
      setProblem({ where: 'email', text: 'Add your email address so we know who you are.' });
      emailRef.current?.focus();
      return;
    }
    if (!EMAIL_SHAPE.test(trimmed)) {
      setProblem({
        where: 'email',
        text: "That doesn't look like an email address. Check for a typo before the @ or after the dot.",
      });
      emailRef.current?.focus();
      return;
    }
    if (password === '') {
      setProblem({ where: 'password', text: 'Enter your password to continue.' });
      passwordRef.current?.focus();
      return;
    }
    if (mode === 'signUp' && !isStrongPassword(password)) {
      setProblem({ where: 'password', text: WEAK_PASSWORD_MESSAGE });
      passwordRef.current?.focus();
      return;
    }
    if (mode === 'signUp' && !agreed) {
      setProblem({ where: 'agree', text: 'To create an account, confirm you are 18 or over and agree to the Terms.' });
      announce('To create an account, confirm you are 18 or over and agree to the Terms.', true);
      return;
    }
    setProblem(null);
    setBusy(true);
    const result =
      mode === 'signIn' ? await signIn(trimmed, password) : await signUp(trimmed, password, TERMS_VERSION);
    setBusy(false);
    if (!result.ok) {
      say(result.message, true);
    } else if (result.needsConfirmation) {
      say('Nearly there. Check your email to confirm the account, then sign in.', false);
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
      'This removes your email address, every recorded answer, your classes, your review and your access from our servers straight away. It does not cancel an App Store or Google Play subscription. Cancel that in your store settings first.',
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

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const initial = (user?.email ?? '?').slice(0, 1).toUpperCase();

  return (
    /* The sign-in card is at the top of the tab now, under a header AND over the tab bar, so both
       chrome heights matter. KeyboardAwareScroll lets UIKit work them out. */
    <KeyboardAwareScroll
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: 'Account' }} />

      <View style={styles.logoRow}>
        <Logo size={44} withName />
      </View>

      {!isSupabaseConfigured ? (
        <Card>
          <Heading>Your progress lives on this phone</Heading>
          <Body>
            Accounts are not switched on in this build, so there is nothing to sign in to. Everything you answer is
            kept on this device.
          </Body>
        </Card>
      ) : initialising ? (
        <Card>
          <View accessibilityLabel="Loading your account" style={styles.skeletonRow}>
            <Skeleton width={52} height={52} round />
            <View style={styles.skeletonText}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="85%" height={12} />
            </View>
          </View>
        </Card>
      ) : user ? (
        <Card raised>
          <View style={styles.profile}>
            <View style={[styles.avatar, { backgroundColor: color.brand }]}>
              <Text style={[styles.avatarText, { color: color.onSolid }]}>{initial}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.heading, { color: color.text }]}>You are signed in</Text>
              <Text numberOfLines={1} style={[styles.body, { color: color.textDim }]}>
                {user.email}
              </Text>
            </View>
          </View>
          <Body>Your progress syncs to your account, so it follows you between the web app and this one.</Body>
          <Button
            variant="secondary"
            label="Sign out"
            // RevenueCat holds the signed-in learner too, and a shared device must not leave the
            // next one holding the last one's purchases.
            onPress={() => void logOutOfRevenueCat().then(signOut)}
          />
          {message && <Message message={message} />}
        </Card>
      ) : (
        <Card raised>
          <Heading>{mode === 'signIn' ? 'Welcome back' : 'Create your free account'}</Heading>
          <Body>
            {mode === 'signIn'
              ? 'Sign in to pick up where you left off. Your streak and review schedule follow you between devices.'
              : 'It takes a minute, and your streak and review schedule will follow you between devices.'}
          </Body>
          <FormField
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (problem?.where === 'email') setProblem(null);
            }}
            placeholder="you@university.ac.uk"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            // Return moves to the password rather than dismissing the keyboard, which is what a
            // two-field form does everywhere else on the platform.
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={problem?.where === 'email' ? problem.text : null}
          />
          <FormField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (problem?.where === 'password') setProblem(null);
            }}
            placeholder="Password"
            accessibilityHint={mode === 'signUp' ? 'A capital letter, a number and a symbol, at least 8 characters' : undefined}
            autoCapitalize="none"
            secureTextEntry
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
            returnKeyType="go"
            onSubmitEditing={() => !busy && void submit()}
            error={problem?.where === 'password' ? problem.text : null}
          />
          {mode === 'signUp' && (
            <>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                accessibilityLabel="I'm 18 or over and I agree to the Terms. I've read the Privacy policy."
                onPress={() => {
                  setAgreed(!agreed);
                  if (problem?.where === 'agree') setProblem(null);
                }}
                style={styles.agreeRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: problem?.where === 'agree' ? color.danger : agreed ? color.brand : color.textDim,
                      backgroundColor: agreed ? color.brand : 'transparent',
                    },
                  ]}
                >
                  {agreed && <Text style={[styles.checkmark, { color: color.onSolid }]}>✓</Text>}
                </View>
                <Text style={[styles.body, styles.agreeText, { color: color.textDim }]}>
                  I’m 18 or over and I agree to the Terms. I’ve read the Privacy policy.
                </Text>
              </Pressable>
              {problem?.where === 'agree' && (
                <Text accessibilityLiveRegion="polite" style={[styles.message, { color: color.danger }]}>
                  {problem.text}
                </Text>
              )}
              <View style={styles.inlineLinks}>
                <GhostButton label="Read the Terms" onPress={() => router.push('/legal/terms')} role="link" />
                <GhostButton label="Read the Privacy policy" onPress={() => router.push('/legal/privacy')} role="link" />
              </View>
            </>
          )}
          {message && <Message message={message} onRetry={busy ? undefined : () => void submit()} />}
          <Button
            label={mode === 'signIn' ? 'Sign in' : 'Create account'}
            loading={busy}
            onPress={() => void submit()}
          />
          <GhostButton
            label={mode === 'signIn' ? 'New here? Create an account' : 'I already have an account'}
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setProblem(null);
              setMessage(null);
            }}
          />
        </Card>
      )}

      {user && <ExamSettings />}

      <Card>
        <Heading>Your progress</Heading>
        <ProgressBar value={totals.known} max={totals.totalQuestions} label="Questions known" />
        <Body>
          {totals.known} of {totals.totalQuestions} questions known · {totals.attempted} answered ·{' '}
          {store.streak()}-day streak
        </Body>
      </Card>

      <Card>
        <Heading>Access</Heading>
        <AccessSummary />
        <Button variant="secondary" label="Full access and school codes" onPress={() => router.push('/pricing')} />
      </Card>

      <Card>
        <Heading>Appearance</Heading>
        <ThemeToggle />
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
          Simplified, conceptual models built to teach mechanism, not clinical or diagnostic tools.
          Not affiliated with or endorsed by any exam body.
        </Body>
      </Card>

      {/* The irreversible things sit apart, at the bottom, in their own card. */}
      <Card danger>
        <Heading>Danger zone</Heading>
        <Body>These can not be undone, so they live here on their own.</Body>
        <Button variant="danger" label="Reset progress" onPress={confirmReset} />
        {user && <Button variant="danger" label="Delete my account…" onPress={confirmDelete} />}
      </Card>
    </KeyboardAwareScroll>
  );
}

/** Which of the two revenue streams is paying for this learner. Ported from the web's
 *  AccessSummary — quietly taking both a school's money and a student's is not a thing this
 *  product should do, and the only way they find out is if we say so. */
/**
 * The learner's exam and training stage, editable for as long as they have the account — the same
 * two settings as the web's account page, saved on change rather than behind a Save button.
 */
function ExamSettings() {
  const { color } = useAppTheme();
  const { targetExam, trainingLevel, university, degreeType, studyYear, ready, canSave, save } = useExamProfile();
  const [failed, setFailed] = useState(false);

  const update = (next: Parameters<typeof save>[0]) => {
    setFailed(false);
    void save(next).then((ok) => setFailed(!ok));
  };

  return (
    <Card>
      <Heading>Revising for</Heading>
      {!ready ? (
        <View accessibilityLabel="Loading your exam settings" style={styles.skeletonText}>
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
      ) : (
        <>
          <Body>
            Optional. Puts what is high-yield for your exam first and changes nothing else — every module stays open.
          </Body>
          <ChipSelect
            label="Exam"
            disabled={!canSave}
            value={targetExam}
            options={[{ value: null, label: 'Not sure yet' }, ...EXAMS.map((e) => ({ value: e.id, label: e.name }))]}
            onChange={(value) => {
              const exam = value !== null && isExamId(value) ? value : null;
              update({ targetExam: exam });
              setExamFilter(exam);
            }}
          />
          <ChipSelect
            label="Stage"
            disabled={!canSave}
            value={trainingLevel}
            options={[
              { value: null, label: 'Prefer not to say' },
              ...TRAINING_LEVELS.map((l) => ({ value: l.id, label: l.name })),
            ]}
            onChange={(value) => update({ trainingLevel: value !== null && isTrainingLevelId(value) ? value : null })}
          />
          <ListSelect
            label="University"
            disabled={!canSave}
            value={university}
            options={[
              { value: null, label: 'Prefer not to say' },
              ...UK_MEDICAL_SCHOOLS.map((s) => ({ value: s.id, label: s.name })),
            ]}
            onChange={(value) => update({ university: value !== null && isUniversityId(value) ? value : null })}
          />
          <ChipSelect
            label="Degree"
            disabled={!canSave}
            value={degreeType}
            options={[
              { value: null, label: 'Prefer not to say' },
              ...DEGREE_TYPES.map((d) => ({ value: d.id, label: d.name })),
            ]}
            onChange={(value) => update({ degreeType: value !== null && isDegreeTypeId(value) ? value : null })}
          />
          <ChipSelect
            label="Year"
            disabled={!canSave}
            value={studyYear === null ? null : String(studyYear)}
            options={[
              { value: null, label: 'Prefer not to say' },
              ...STUDY_YEARS.map((y) => ({ value: String(y), label: `Year ${y}` })),
            ]}
            onChange={(value) => update({ studyYear: value !== null && isStudyYear(Number(value)) ? (Number(value) as typeof STUDY_YEARS[number]) : null })}
          />
          {failed && (
            <Text accessibilityLiveRegion="polite" style={[styles.message, { color: color.danger }]}>
              That did not save. Check your connection and try again.
            </Text>
          )}
        </>
      )}
    </Card>
  );
}

function AccessSummary() {
  const { status, source, institutionName } = useNativeEntitlement();
  const { color } = useAppTheme();

  if (status === 'loading') return <Body>Checking your access…</Body>;
  if (status === 'free') {
    return <Body>Free account: the three free simulators and the reference pages.</Body>;
  }
  if (source === 'institution') {
    return (
      <>
        <Text style={[styles.active, { color: color.ok }]}>
          Full access, covered by {institutionName ?? 'your institution'}
        </Text>
        <Body>
          If you are also paying for a personal subscription you can cancel it, but this does not
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

function Card({ children, raised = false, danger = false }: { children: React.ReactNode; raised?: boolean; danger?: boolean }) {
  const { color } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        raised && SHADOW.raised,
        { backgroundColor: color.panel, borderColor: danger ? color.danger : color.panelBorder },
      ]}
    >
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
function Message({ message, onRetry }: { message: { text: string; error: boolean }; onRetry?: () => void }) {
  const { color } = useAppTheme();
  return (
    <>
      <Text accessibilityLiveRegion="polite" style={[styles.message, { color: message.error ? color.danger : color.text }]}>
        {message.error ? 'Error: ' : ''}
        {message.text}
      </Text>
      {message.error && onRetry && <RetryButton onPress={onRetry} />}
    </>
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
  return (
    <Button
      variant={destructive ? 'danger' : 'ghost'}
      fullWidth={false}
      label={label}
      onPress={onPress}
      role={role}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACE.xl, gap: SPACE.xl },
  card: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACE.xl, gap: SPACE.lg },
  profile: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  profileText: { flex: 1, gap: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONT.xl, fontWeight: '700' },
  logoRow: { alignItems: 'center', paddingTop: SPACE.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  skeletonText: { flex: 1, gap: SPACE.md },
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
