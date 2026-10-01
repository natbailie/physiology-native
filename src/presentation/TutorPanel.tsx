import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { RetryButton } from './RetryButton';
import { useChat } from '../shared/chat/useChat';
import { useModuleProgress } from '../home/useModuleProgress';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

const CONSENT_KEY = 'tutorConsent';

/**
 * Whether the learner has acknowledged what the tutor sends, once per install. `null` while the
 * stored answer is still being read, so the sheet shows neither the gate nor the composer for a
 * frame instead of flashing the wrong one. A storage failure reads as "not yet", which shows the
 * notice again and never sends anything without it.
 */
function useTutorConsent(): { consented: boolean | null; accept: () => void } {
  const [consented, setConsented] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(CONSENT_KEY)
      .then((value) => live && setConsented(value === 'yes'))
      .catch(() => live && setConsented(false));
    return () => {
      live = false;
    };
  }, []);
  const accept = () => {
    setConsented(true);
    AsyncStorage.setItem(CONSENT_KEY, 'yes').catch(() => undefined);
  };
  return { consented, accept };
}

/**
 * The tutor, as a sheet over the module.
 *
 * Everything behind it is file-synced: the corpus, the term-overlap retrieval, the system prompt
 * and `useChat` itself. What is native is only the surface — and the endpoint, which is always
 * the deployed edge function here (see the note on `isDev` in src/lib/env.ts).
 *
 * The edge function requires a signed-in learner, so this says so plainly rather than failing on
 * send. It also passes the learner's weak spots through, which is what lets the tutor open on
 * what they are actually getting wrong.
 */
export function TutorPanel({
  moduleId,
  accent,
  variant = 'inline',
}: {
  moduleId?: string;
  accent: string;
  /** `floating` is the app-wide pill over the tab screens; `inline` sits in a module's content. */
  variant?: 'inline' | 'floating';
}) {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  /* Whether the keyboard is covering the bottom of the sheet, so the composer can drop the
   * home-indicator inset it no longer needs. `KeyboardAvoidingView` moves the composer but does
   * not say why, so the flag is read from the events directly. */
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    // `Will` rather than `Did` so the padding changes in the same frame the keyboard slides in;
    // Android only emits the `Did` pair, and falls back to them.
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setKeyboardUp(true),
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setKeyboardUp(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const { weakSpots } = useModuleProgress();
  const { user } = useAuth();
  const { messages, status, error, send, retry, clear } = useChat({ moduleId, weakSpots });

  const usable = isSupabaseConfigured && user !== null;
  const { consented, accept } = useTutorConsent();

  const submit = () => {
    const text = draft.trim();
    if (text === '' || status !== 'idle') return;
    setDraft('');
    send(text);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.launcher,
          variant === 'floating'
            ? [
                styles.floating,
                // Sits above the tab bar (49pt) and the home indicator.
                { bottom: insets.bottom + 49 + SPACE.lg, backgroundColor: accent },
              ]
            : { borderColor: accent, backgroundColor: withAlpha(accent, 0.1) },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.launcherText, { color: variant === 'floating' ? color.onSolid : accent }]}>
          Ask the tutor
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        supportedOrientations={['portrait']}
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          // Android needs one too: a Modal is its own window, so the activity's resize mode does
          // not reach it and the composer would sit under the keyboard.
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.sheet, { backgroundColor: color.bg }]}
        >
          {/* The sheet is presented full-screen, so it owns its own top inset — without this the
              title sat under the notch on a device with one. It was a hardcoded 60pt before. */}
          <View style={[styles.sheetHeader, { paddingTop: insets.top + SPACE.md }]}>
            <Text style={[styles.sheetTitle, { color: color.text }]}>Tutor</Text>
            <View style={styles.headerActions}>
              {messages.length > 0 && (
                <Pressable onPress={clear} accessibilityRole="button" style={styles.headerButton}>
                  <Text style={[styles.headerAction, { color: accent }]}>Clear</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                style={styles.headerButton}
              >
                <Text style={[styles.headerAction, { color: accent }]}>Done</Text>
              </Pressable>
            </View>
          </View>

          {!usable ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: color.textDim }]}>
                {isSupabaseConfigured
                  ? 'Sign in to ask the tutor. It answers through an account-gated endpoint.'
                  : 'This build has no backend configured, so the tutor is unavailable.'}
              </Text>
            </View>
          ) : consented !== true ? (
            <View style={styles.empty}>
              {consented === false && (
                <>
                  <Text accessibilityRole="header" style={[styles.consentTitle, { color: color.text }]}>
                    Before you ask
                  </Text>
                  <Text style={[styles.emptyText, { color: color.textDim }]}>
                    Answers are written by an AI service (Mistral AI, or Google as a backup) and can be
                    wrong. To answer, your question, a summary of topics you find difficult and the
                    readings on screen are sent to that service. Your name and email are not. Please do
                    not include patient details.
                  </Text>
                  <Pressable
                    onPress={accept}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.consentButton, { backgroundColor: accent }, pressed && styles.pressed]}
                  >
                    <Text style={[styles.sendText, { color: color.onSolid }]}>I understand, continue</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <>
              {/* Without this the first tap on Send only dismisses the keyboard, because the
                  transcript swallows it to do so. */}
              <ScrollView contentContainerStyle={styles.transcript} keyboardShouldPersistTaps="handled">
                {messages.length === 0 && (
                  <Text style={[styles.emptyText, { color: color.textDim }]}>
                    {moduleId
                      ? 'Ask about anything in this module. The tutor reads the same explainers you do.'
                      : 'Ask about any physiology topic. The tutor reads the same explainers you do.'}
                  </Text>
                )}
                {messages.map((message, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bubble,
                      message.role === 'user'
                        ? [styles.userBubble, { backgroundColor: accent }]
                        : [styles.assistantBubble, { backgroundColor: color.panel, borderColor: color.panelBorder }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: message.role === 'user' ? color.onSolid : color.text },
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                ))}
                {status === 'thinking' && <ActivityIndicator color={accent} style={styles.thinking} />}
                {error && (
                  <>
                    <Text style={[styles.error, { color: color.danger }]}>{error}</Text>
                    <RetryButton onPress={retry} />
                  </>
                )}
              </ScrollView>

              {/* Said before the learner presses Send, like the web: what leaves the phone, and
                  that the answer can be wrong. */}
              <Text style={[styles.disclosure, { color: color.textDim, borderTopColor: color.panelBorder }]}>
                Answers are AI-generated and can be wrong. Your question, a summary of topics you find
                difficult and the readings on screen are sent to Mistral AI or Google to answer it, not
                your name or email. Don’t include patient details.
              </Text>
              <View
                style={[
                  styles.composer,
                  {
                    /* The home-indicator inset only exists while the composer is at the bottom of
                       the screen. With the keyboard up the keyboard is there instead, and keeping
                       it added a finger's width of dead grey above the keys. */
                    paddingBottom: keyboardUp ? SPACE.lg : insets.bottom + SPACE.lg,
                  },
                ]}
              >
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask a question"
                  placeholderTextColor={color.textFaint}
                  accessibilityLabel="Your question for the tutor"
                  returnKeyType="send"
                  style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
                  multiline
                  onSubmitEditing={submit}
                />
                <Pressable
                  onPress={submit}
                  disabled={draft.trim() === '' || status !== 'idle'}
                  accessibilityRole="button"
                  accessibilityLabel="Send question"
                  accessibilityState={{ disabled: draft.trim() === '' || status !== 'idle' }}
                  style={({ pressed }) => [
                    styles.send,
                    { backgroundColor: accent },
                    (draft.trim() === '' || status !== 'idle') && styles.sendDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.sendText, { color: color.onSolid }]}>Send</Text>
                </Pressable>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launcher: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floating: {
    position: 'absolute',
    right: SPACE.lg,
    borderWidth: 0,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  launcherText: { fontSize: FONT.sm, fontWeight: '700' },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.lg,
  },
  sheetTitle: { fontSize: FONT.lg, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: SPACE.md },
  headerButton: { minHeight: TAP, minWidth: TAP, alignItems: 'center', justifyContent: 'center' },
  headerAction: { fontSize: FONT.sm, fontWeight: '700' },
  transcript: { padding: SPACE.xl, gap: SPACE.md },
  bubble: { borderRadius: RADIUS.md, padding: SPACE.lg, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end' },
  assistantBubble: { alignSelf: 'flex-start', borderWidth: 1 },
  bubbleText: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  thinking: { alignSelf: 'flex-start', marginLeft: SPACE.md },
  error: { fontSize: FONT.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.xxxl },
  consentTitle: { fontSize: FONT.lg, fontWeight: '700', marginBottom: SPACE.lg },
  consentButton: {
    marginTop: SPACE.xl,
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxl,
  },
  emptyText: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose, textAlign: 'center' },
  disclosure: {
    fontSize: FONT.xs,
    lineHeight: FONT.xs * LINE.prose,
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.md,
    borderTopWidth: 1,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.lg,
    minHeight: TAP,
    maxHeight: 120,
    fontSize: FONT.base,
  },
  send: {
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontSize: FONT.sm, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
