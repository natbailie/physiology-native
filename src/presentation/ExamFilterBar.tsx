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
          { borderColor: color.panelBorder, backgroundColor: selected ? color.brand : color.panel },
        ]}
      >
        <Text style={[styles.chipText, { color: selected ? color.onSolid : color.textDim }]}>{label}</Text>
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
  scroll: { flexGrow: 0, marginBottom: SPACE.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  chip: {
    minHeight: TAP,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
  },
  chipText: { fontSize: FONT.micro, fontWeight: '600' },
});
