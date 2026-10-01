import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { EXAMS, type ExamId } from '../home/exams';
import { setExamFilter, useExamFilter } from '../home/examFilter';
import { FONT, RADIUS, SPACE, TAP, useAppTheme } from './theme';

/**
 * The catalogue's exam switcher, the phone's half of the web's `ExamFilterBar`.
 *
 * Horizontally scrolling rather than wrapping: six chips do not fit across a phone, and a wrapped
 * row would push the first module card below the fold on the screen whose whole job is to show
 * module cards.
 *
 * "All exams" leads, and is a chip rather than a cross on the selected one, for the same reason it
 * does on the web — a learner who cannot see why the list looks short concludes the app is
 * missing modules rather than that they filtered it.
 */
export function ExamFilterBar() {
  const active = useExamFilter();
  const { color } = useAppTheme();

  const chip = (id: ExamId | null, label: string, key: string) => {
    const selected = active === id;
    return (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => setExamFilter(id)}
        style={[
          styles.chip,
          {
            borderColor: selected ? color.select : color.panelBorder,
            backgroundColor: selected ? color.select : color.panel,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: selected ? color.onSolid : color.text }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {chip(null, 'All exams', 'all')}
      {EXAMS.map((exam) => chip(exam.id, exam.short, exam.id))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Bled to the screen edges (the parent pads 16) so chips scroll under the gutter instead of
  // stopping short of it, which is also what tells a thumb the row scrolls.
  scroll: { flexGrow: 0, marginHorizontal: -SPACE.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingHorizontal: SPACE.xl },
  chip: {
    minHeight: TAP,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.xl,
  },
  chipText: { fontSize: FONT.xs, fontWeight: '600' },
});
