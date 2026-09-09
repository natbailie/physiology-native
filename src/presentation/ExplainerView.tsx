import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExplainerContent, ExplainerSection } from '../shared/explainer/types';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';

/**
 * The module's explainer prose, from the file-synced `content.ts`.
 *
 * A CONTENTS PAGE, not a lesson: the panel opens on a numbered list of section headings, each
 * one a claim about the mechanism, and a learner opens the ones they want. That is the web's
 * `ExplainerPanel`, and its docblock says why — opening every section by default "reproduced the
 * wall of prose the headings exist to break up". This screen used to do exactly that: one
 * Hide/Read toggle over the whole lesson, every section expanded underneath it, several phone
 * screens of scrolling before the headings were any use at all.
 *
 * Sections are INDEPENDENT, as they are on the web, where each is its own `<details>`: opening
 * one does not close another, so two paragraphs can be read side by side. The web's own test
 * asserts that (`[false, true, false]`), and an accordion that closes the previous section is a
 * different and more annoying control.
 *
 * A section's `demos` become buttons that load the scenario the paragraph is about, which is the
 * same affordance the web offers.
 */
export function ExplainerView({
  content,
  accent,
  onOpenScenario,
  presetLabels,
  scenariosLocked = false,
}: {
  content: ExplainerContent;
  accent: string;
  /** Loads a named preset into the live simulator. */
  onOpenScenario?: (presetId: string) => void;
  /** The module's own labels, so a demo button reads as the scenario bar does. */
  presetLabels?: Record<string, string>;
  /** True while a pattern question is unanswered, matching the web's locked preset bar: loading a
   *  scenario mid-question would change the very thing the learner is being asked to name. */
  scenariosLocked?: boolean;
}) {
  const { color } = useAppTheme();
  const [panelOpen, setPanelOpen] = useState(true);
  /** Which sections are open, by index. Empty to start, like the web's cards. */
  const [openSections, setOpenSections] = useState<ReadonlySet<number>>(() => new Set());

  const toggleSection = useCallback((index: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  }, []);

  const sections = content.sections ?? [];
  const flat = content.paragraphs ?? [];

  return (
    <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Pressable
        onPress={() => setPanelOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: panelOpen }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: color.text }]}>{content.title}</Text>
        <Text style={[styles.toggle, { color: accent }]}>{panelOpen ? 'Hide' : 'Read'}</Text>
      </Pressable>

      {panelOpen && (
        <View style={styles.body}>
          {/* Legacy flat prose. Every module has migrated to `sections`, so in practice this is
              empty — it is kept because the synced type still allows it. */}
          {flat.map((paragraph, i) => (
            <Text key={i} style={[styles.paragraph, { color: color.textDim }]}>
              {paragraph}
            </Text>
          ))}

          {sections.map((section, i) => (
            <SectionCard
              key={section.heading}
              section={section}
              index={i}
              open={openSections.has(i)}
              onToggle={toggleSection}
              accent={accent}
              onOpenScenario={onOpenScenario}
              presetLabels={presetLabels}
              scenariosLocked={scenariosLocked}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/** One numbered, collapsible claim. */
function SectionCard({
  section,
  index,
  open,
  onToggle,
  accent,
  onOpenScenario,
  presetLabels,
  scenariosLocked,
}: {
  section: ExplainerSection;
  index: number;
  open: boolean;
  onToggle: (index: number) => void;
  accent: string;
  onOpenScenario?: (presetId: string) => void;
  presetLabels?: Record<string, string>;
  scenariosLocked: boolean;
}) {
  const { color } = useAppTheme();

  return (
    <View style={[styles.section, { borderColor: color.panelBorder }]}>
      <Pressable
        onPress={() => onToggle(index)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${index + 1}. ${section.heading}`}
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}
      >
        <Text style={[styles.ordinal, { color: accent }]}>{index + 1}</Text>
        <Text style={[styles.heading, { color: color.text }]}>{section.heading}</Text>
        {/* A rotated caret rather than a glyph font, so it needs no icon set and points the way
            the web's chevron does. */}
        <Text style={[styles.chevron, { color: color.textFaint }, open && styles.chevronOpen]}>⌄</Text>
      </Pressable>

      {open && (
        <View style={styles.sectionBody}>
          {section.paragraphs.map((paragraph, j) => (
            <Text key={j} style={[styles.paragraph, { color: color.textDim }]}>
              {paragraph}
            </Text>
          ))}
          {onOpenScenario && section.demos && section.demos.length > 0 && (
            <View style={styles.demos}>
              {section.demos.map((demo) => {
                // No label means the module does not ship this preset. Render nothing rather than
                // the raw id — the web does the same, and a button reading `addisons` is worse
                // than no button.
                const label = demo.label ?? presetLabels?.[demo.preset];
                if (!label) return null;
                return (
                  <Pressable
                    key={demo.preset}
                    onPress={() => onOpenScenario(demo.preset)}
                    disabled={scenariosLocked}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: scenariosLocked }}
                    style={({ pressed }) => [
                      styles.demoButton,
                      { borderColor: accent, backgroundColor: withAlpha(accent, 0.1) },
                      pressed && styles.pressed,
                      scenariosLocked && styles.locked,
                    ]}
                  >
                    <Text style={[styles.demoText, { color: accent }]}>{label}</Text>
                    {demo.watch && (
                      <Text style={[styles.demoWatch, { color: color.textFaint }]}>watch {demo.watch}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
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
  body: { marginTop: SPACE.lg, gap: SPACE.md },

  section: { borderWidth: 1, borderRadius: RADIUS.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    // A collapsed row is the whole target, and it must clear the iOS minimum on its own — the
    // headings run to two and three lines, so the padding cannot be relied on to get it there.
    minHeight: TAP,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  ordinal: { fontSize: FONT.micro, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 12 },
  heading: { flex: 1, fontSize: FONT.sm, fontWeight: '700', lineHeight: FONT.sm * LINE.snug },
  chevron: { fontSize: FONT.base, lineHeight: FONT.base },
  // `⌄` already points down for a closed row; flipping it points it up for an open one.
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  sectionBody: { gap: SPACE.lg, paddingHorizontal: SPACE.lg, paddingBottom: SPACE.lg },

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
  locked: { opacity: 0.4 },
});
