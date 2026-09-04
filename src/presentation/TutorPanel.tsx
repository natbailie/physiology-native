import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { useChat } from '../shared/chat/useChat';
import { useModuleProgress } from '../home/useModuleProgress';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

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
export function TutorPanel({ moduleId, accent }: { moduleId?: string; accent: string }) {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const { weakSpots } = useModuleProgress();
  const { user } = useAuth();
  const { messages, status, error, send, clear } = useChat({ moduleId, weakSpots });

  const usable = isSupabaseConfigured && user !== null;

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
          { borderColor: accent, backgroundColor: withAlpha(accent, 0.1) },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.launcherText, { color: accent }]}>Ask the tutor</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                  ? 'Sign in to ask the tutor — it answers through an account-gated endpoint.'
                  : 'This build has no backend configured, so the tutor is unavailable.'}
              </Text>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.transcript}>
                {messages.length === 0 && (
                  <Text style={[styles.emptyText, { color: color.textDim }]}>
                    Ask about anything in this module. The tutor reads the same explainers you do.
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
                {error && <Text style={[styles.error, { color: color.danger }]}>{error}</Text>}
              </ScrollView>

              <View
                style={[
                  styles.composer,
                  { borderTopColor: color.panelBorder, paddingBottom: insets.bottom + SPACE.lg },
                ]}
              >
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask a question"
                  placeholderTextColor={color.textFaint}
                  style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
                  multiline
                  onSubmitEditing={submit}
                />
                <Pressable
                  onPress={submit}
                  disabled={draft.trim() === '' || status !== 'idle'}
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
  emptyText: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose, textAlign: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.lg,
    borderTopWidth: 1,
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
