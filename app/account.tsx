import { Stack } from 'expo-router';
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
  useColorScheme,
} from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { useModuleProgress } from '../src/home/useModuleProgress';
import { useProgressStore } from '../src/shared/assessment/useProgressStore';

/**
 * Sign in, and what signing in is for.
 *
 * The whole screen tolerates an unconfigured backend, the way the web app does: with no
 * EXPO_PUBLIC_SUPABASE_* set, `isSupabaseConfigured` is false and this says so plainly rather
 * than offering a form that cannot work. Progress still works in that state — it is simply
 * on-device only.
 */
export default function AccountScreen() {
  const isDark = useColorScheme() === 'dark';
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

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Account' }} />

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.heading, isDark && styles.textLight]}>Progress</Text>
        <Text style={[styles.body, isDark && styles.bodyDark]}>
          {totals.attempted} answered · {totals.known} of {totals.totalQuestions} known ·{' '}
          {store.streak()}-day streak
        </Text>
        <Pressable onPress={confirmReset} style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
          <Text style={styles.ghostText}>Reset progress</Text>
        </Pressable>
      </View>

      {!isSupabaseConfigured ? (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.heading, isDark && styles.textLight]}>Accounts are off</Text>
          <Text style={[styles.body, isDark && styles.bodyDark]}>
            This build has no Supabase credentials, so there is nothing to sign in to. Progress is
            kept on this device.
          </Text>
        </View>
      ) : initialising ? (
        <ActivityIndicator />
      ) : user ? (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.heading, isDark && styles.textLight]}>Signed in</Text>
          <Text style={[styles.body, isDark && styles.bodyDark]}>{user.email}</Text>
          <Text style={[styles.body, isDark && styles.bodyDark]}>
            Progress syncs to your account, so it follows you between the web app and this one.
          </Text>
          <Pressable onPress={signOut} style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
            <Text style={styles.ghostText}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.heading, isDark && styles.textLight]}>
            {mode === 'signIn' ? 'Sign in' : 'Create an account'}
          </Text>
          <Text style={[styles.body, isDark && styles.bodyDark]}>
            Signing in syncs your progress, so your streak and review schedule follow you between
            devices.
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={[styles.input, isDark && styles.inputDark]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            autoCapitalize="none"
            secureTextEntry
            style={[styles.input, isDark && styles.inputDark]}
          />
          {message && <Text style={styles.message}>{message}</Text>}
          <Pressable
            onPress={submit}
            disabled={busy || email === '' || password === ''}
            style={({ pressed }) => [
              styles.primary,
              (busy || email === '' || password === '') && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>
              {busy ? 'Working…' : mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
          >
            <Text style={styles.ghostText}>
              {mode === 'signIn' ? 'Create an account instead' : 'I already have an account'}
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
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, gap: 10 },
  cardDark: { backgroundColor: '#1e293b' },
  heading: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  body: { fontSize: 14, lineHeight: 21, color: '#475569' },
  bodyDark: { color: '#cbd5e1' },
  textLight: { color: '#e2e8f0' },
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
  ghost: { paddingVertical: 8, alignItems: 'center' },
  ghostText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  message: { fontSize: 13, color: '#dc2626' },
  pressed: { opacity: 0.6 },
});
