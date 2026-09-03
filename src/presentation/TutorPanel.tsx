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
  useColorScheme,
} from 'react-native';
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
  const isDark = useColorScheme() === 'dark';
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
        style={({ pressed }) => [styles.launcher, { borderColor: accent }, pressed && styles.pressed]}
      >
        <Text style={[styles.launcherText, { color: accent }]}>Ask the tutor</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, isDark && styles.sheetDark]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, isDark && styles.textLight]}>Tutor</Text>
            <View style={styles.headerActions}>
              {messages.length > 0 && (
                <Pressable onPress={clear} hitSlop={8}>
                  <Text style={[styles.headerAction, { color: accent }]}>Clear</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={[styles.headerAction, { color: accent }]}>Done</Text>
              </Pressable>
            </View>
          </View>

          {!usable ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, isDark && styles.bodyDark]}>
                {isSupabaseConfigured
                  ? 'Sign in to ask the tutor — it answers through an account-gated endpoint.'
                  : 'This build has no backend configured, so the tutor is unavailable.'}
              </Text>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.transcript}>
                {messages.length === 0 && (
                  <Text style={[styles.emptyText, isDark && styles.bodyDark]}>
                    Ask about anything in this module. The tutor reads the same explainers you do.
                  </Text>
                )}
                {messages.map((message, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bubble,
                      message.role === 'user' ? { backgroundColor: accent } : styles.assistantBubble,
                      message.role === 'user' ? styles.userBubble : null,
                      isDark && message.role !== 'user' ? styles.assistantBubbleDark : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        message.role === 'user' ? styles.userText : isDark ? styles.textLight : null,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                ))}
                {status === 'thinking' && <ActivityIndicator color={accent} style={styles.thinking} />}
                {error && <Text style={styles.error}>{error}</Text>}
              </ScrollView>

              <View style={[styles.composer, isDark && styles.composerDark]}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask a question"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, isDark && styles.inputDark]}
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
                  <Text style={styles.sendText}>Send</Text>
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
  launcher: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  launcherText: { fontSize: 14, fontWeight: '600' },
  sheet: { flex: 1, backgroundColor: '#f8fafc' },
  sheetDark: { backgroundColor: '#0f172a' },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerAction: { fontSize: 15, fontWeight: '600' },
  transcript: { padding: 16, gap: 10 },
  bubble: { borderRadius: 12, padding: 12, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: '#ffffff', alignSelf: 'flex-start' },
  assistantBubbleDark: { backgroundColor: '#1e293b' },
  bubbleText: { fontSize: 14, lineHeight: 21, color: '#0f172a' },
  userText: { color: '#ffffff' },
  thinking: { alignSelf: 'flex-start', marginLeft: 8 },
  error: { fontSize: 13, color: '#dc2626' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 14, lineHeight: 21, color: '#64748b', textAlign: 'center' },
  bodyDark: { color: '#94a3b8' },
  textLight: { color: '#e2e8f0' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  composerDark: { borderTopColor: '#334155' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 15,
    color: '#0f172a',
  },
  inputDark: { borderColor: '#334155', color: '#e2e8f0' },
  send: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
