import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { ExplainerContent } from '../shared/explainer/types';

/**
 * The module's explainer prose, from the file-synced `content.ts`.
 *
 * Collapsed by default. The web can afford to have this open beside the simulator; on a phone the
 * prose is several screens long and would push the controls below the fold, so it opens on
 * request. A section's `demos` become buttons that load the scenario the paragraph is about,
 * which is the same affordance the web's ExplainerPanel offers.
 */
export function ExplainerView({
  content,
  accent,
  onOpenScenario,
  presetLabels,
}: {
  content: ExplainerContent;
  accent: string;
  /** Loads a named preset into the live simulator. */
  onOpenScenario?: (presetId: string) => void;
  /** The module's own labels, so a demo button reads as the scenario bar does. */
  presetLabels?: Record<string, string>;
}) {
  const isDark = useColorScheme() === 'dark';
  const [open, setOpen] = useState(false);

  const sections = content.sections ?? [];
  const flat = content.paragraphs ?? [];

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.header}>
        <Text style={[styles.title, isDark && styles.textLight]}>{content.title}</Text>
        <Text style={[styles.toggle, { color: accent }]}>{open ? 'Hide' : 'Read'}</Text>
      </Pressable>

      {open && (
        <View style={styles.body}>
          {flat.map((paragraph, i) => (
            <Text key={i} style={[styles.paragraph, isDark && styles.paragraphDark]}>
              {paragraph}
            </Text>
          ))}

          {sections.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={[styles.heading, isDark && styles.textLight]}>{section.heading}</Text>
              {section.paragraphs.map((paragraph, j) => (
                <Text key={j} style={[styles.paragraph, isDark && styles.paragraphDark]}>
                  {paragraph}
                </Text>
              ))}
              {section.demos && section.demos.length > 0 && onOpenScenario && (
                <View style={styles.demos}>
                  {section.demos.map((demo) => (
                    <Pressable
                      key={demo.preset}
                      onPress={() => onOpenScenario(demo.preset)}
                      style={({ pressed }) => [
                        styles.demoButton,
                        { borderColor: accent },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.demoText, { color: accent }]}>
                        {demo.label ?? presetLabels?.[demo.preset] ?? demo.preset}
                      </Text>
                      {demo.watch && (
                        <Text style={[styles.demoWatch, isDark && styles.paragraphDark]}>
                          watch {demo.watch}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14 },
  cardDark: { backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 15, fontWeight: '600', color: '#0f172a', flex: 1 },
  toggle: { fontSize: 14, fontWeight: '600' },
  body: { marginTop: 12, gap: 12 },
  section: { gap: 8 },
  heading: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginTop: 4 },
  paragraph: { fontSize: 14, lineHeight: 22, color: '#475569' },
  paragraphDark: { color: '#cbd5e1' },
  textLight: { color: '#e2e8f0' },
  demos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  demoButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  demoText: { fontSize: 13, fontWeight: '600' },
  demoWatch: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  pressed: { opacity: 0.6 },
});
