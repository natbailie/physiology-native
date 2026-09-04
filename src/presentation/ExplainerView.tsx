import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExplainerContent } from '../shared/explainer/types';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';

/**
 * The module's explainer prose, from the file-synced `content.ts`.
 *
 * Open by default now that it has a tab of its own. It used to be collapsed, and for a good
 * reason: it sat in the same scroll as the simulator, where several screens of prose would push
 * the controls below the fold. On the Learn tab it IS the content, and a learner who has just
 * tapped "Learn" should not have to tap "Read" as well. It stays collapsible, because the
 * headings are a useful way to skim a long piece.
 *
 * A section's `demos` become buttons that load the scenario the paragraph is about, which is the
 * same affordance the web's ExplainerPanel offers.
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
  const { color } = useAppTheme();
  const [open, setOpen] = useState(true);

  const sections = content.sections ?? [];
  const flat = content.paragraphs ?? [];

  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: color.text }]}>{content.title}</Text>
        <Text style={[styles.toggle, { color: accent }]}>{open ? 'Hide' : 'Read'}</Text>
      </Pressable>

      {open && (
        <View style={styles.body}>
          {flat.map((paragraph, i) => (
            <Text key={i} style={[styles.paragraph, { color: color.textDim }]}>
              {paragraph}
            </Text>
          ))}

          {sections.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={[styles.heading, { color: color.text }]}>{section.heading}</Text>
              {section.paragraphs.map((paragraph, j) => (
                <Text key={j} style={[styles.paragraph, { color: color.textDim }]}>
                  {paragraph}
                </Text>
              ))}
              {section.demos && section.demos.length > 0 && onOpenScenario && (
                <View style={styles.demos}>
                  {section.demos.map((demo) => (
                    <Pressable
                      key={demo.preset}
                      onPress={() => onOpenScenario(demo.preset)}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.demoButton,
                        { borderColor: accent, backgroundColor: withAlpha(accent, 0.1) },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.demoText, { color: accent }]}>
                        {demo.label ?? presetLabels?.[demo.preset] ?? demo.preset}
                      </Text>
                      {demo.watch && (
                        <Text style={[styles.demoWatch, { color: color.textFaint }]}>
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
  card: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.lg,
    minHeight: TAP,
  },
  title: { fontSize: FONT.base, fontWeight: '700', flex: 1 },
  toggle: { fontSize: FONT.sm, fontWeight: '700' },
  body: { marginTop: SPACE.lg, gap: SPACE.lg },
  section: { gap: SPACE.md },
  heading: { fontSize: FONT.sm, fontWeight: '700', marginTop: SPACE.xs },
  paragraph: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  demos: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md, marginTop: SPACE.xs },
  demoButton: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
  },
  demoText: { fontSize: FONT.xs, fontWeight: '700' },
  demoWatch: { fontSize: FONT.micro, marginTop: 2 },
  pressed: { opacity: 0.6 },
});
