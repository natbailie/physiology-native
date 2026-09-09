import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lookupTerm } from '../shared/glossary/terms';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';

/**
 * Tap-to-explain for the readout tiles, which is what the web gets from hovering a `<Term>`.
 *
 * The web wraps every tile label in `<Term>`: hover or focus reveals a bubble with the expansion
 * and the definition, and the label falls through to plain text for anything the glossary does
 * not define. A phone has no hover, and a tooltip that opens on touch is the worst of both — it
 * covers the numbers the learner is reading and there is nothing obvious to dismiss it with.
 *
 * So the same glossary is spent through a sheet instead. One sheet for the whole app, driven from
 * a context, because the alternative is a Modal mounted per tile: a nine-readout module would
 * carry nine of them, and RN's Modal is a real native view rather than a div.
 *
 * A tile with no glossary entry is not pressable at all — no dotted underline, no hint, no
 * empty sheet. That is the same "falls through to plain text" contract the web has, and it means
 * coverage is visible to the learner: if a label is underlined it will explain itself.
 */

export interface TermSheetApi {
  /** Opens the sheet for a readout label. No-op for a label the glossary does not define.
   *  `moduleId` lets a module answer for a label it owns — seventeen of them print a tile called
   *  `State` and mean something different by it. */
  open: (label: string, moduleId?: string) => void;
  /** Whether the glossary can explain this label — drives the tile's affordance. */
  has: (label: string, moduleId?: string) => boolean;
}

const NOOP: TermSheetApi = { open: () => {}, has: () => false };

const TermSheetContext = createContext<TermSheetApi>(NOOP);

export function useTermSheet(): TermSheetApi {
  return useContext(TermSheetContext);
}

export function TermSheetProvider({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState<{ label: string; moduleId?: string } | null>(null);

  const api = useMemo<TermSheetApi>(
    () => ({
      open: (label, moduleId) => {
        if (lookupTerm(label, moduleId)) setShown({ label, moduleId });
      },
      has: (label, moduleId) => lookupTerm(label, moduleId) !== undefined,
    }),
    [],
  );

  const close = useCallback(() => setShown(null), []);
  const label = shown?.label ?? null;
  const entry = shown ? lookupTerm(shown.label, shown.moduleId) : undefined;

  return (
    <TermSheetContext.Provider value={api}>
      {children}
      <Modal
        visible={entry !== undefined}
        transparent
        animationType="fade"
        onRequestClose={close}
        // Without this the sheet stays portrait-locked inside a rotated app on iPad.
        supportedOrientations={['portrait', 'landscape']}
      >
        {/* The scrim is the dismiss target, which is what a learner reaches for first. The sheet
            itself swallows the press so a tap on the prose does not close what it is reading. */}
        <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Close definition">
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: color.panel,
                borderColor: color.panelBorder,
                paddingBottom: insets.bottom + SPACE.xxl,
              },
            ]}
            // A press inside must not bubble to the scrim, and must not read as a button either.
            onPress={() => {}}
            accessibilityRole="none"
          >
            <View style={[styles.grabber, { backgroundColor: color.panelBorder }]} />
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.label, { color: color.text }]}>{label}</Text>
              {entry?.expansion && (
                <Text style={[styles.expansion, { color: color.textDim }]}>{entry.expansion}</Text>
              )}
              <Text style={[styles.definition, { color: color.text }]}>{entry?.definition}</Text>
            </ScrollView>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.done,
                { backgroundColor: withAlpha(color.brand, pressed ? 0.28 : 0.14) },
              ]}
            >
              <Text style={[styles.doneText, { color: color.brand }]}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </TermSheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: SPACE.md,
    paddingHorizontal: SPACE.xxl,
    // Leaves the top of the screen visible, so the sheet reads as a layer over the page rather
    // than a new one — and so a long definition scrolls rather than growing off the top.
    maxHeight: '72%' as unknown as number,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    marginBottom: SPACE.lg,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: SPACE.lg },
  label: {
    fontSize: FONT.lg,
    fontWeight: '700',
    lineHeight: FONT.lg * LINE.tight,
  },
  expansion: {
    fontSize: FONT.sm,
    marginTop: SPACE.xs,
    lineHeight: FONT.sm * LINE.snug,
  },
  definition: {
    fontSize: FONT.base,
    marginTop: SPACE.lg,
    lineHeight: FONT.base * LINE.prose,
  },
  done: {
    minHeight: TAP,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.md,
  },
  doneText: { fontSize: FONT.base, fontWeight: '600' },
});
