import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { FONT, LINE, RADIUS, SPACE, TAP, useAppTheme } from '../theme';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Why the value is wrong, written next to the field it is about. Absent means no problem. */
  error?: string | null;
  /** Label beside the input (default) or above it. Rows suit short values; stack for long ones. */
  layout?: 'row' | 'stacked';
  /** A unit or suffix inside the row, e.g. "mmHg". */
  hint?: string;
}

/**
 * One labelled field.
 *
 * Horizontal by default — label left, input right — because that is what a short form on a phone
 * should be: the eye moves along the row rather than zig-zagging label, field, label, field. The
 * formula calculator already worked that way; this gives the sign-in and code forms the same shape.
 *
 * The error is drawn UNDER the field it belongs to, with a mark and in words as well as red, and
 * is a polite live region so VoiceOver reads it the moment it appears.
 */
export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, layout = 'row', hint, ...input },
  ref,
) {
  const { color } = useAppTheme();
  const invalid = Boolean(error);

  return (
    <View style={styles.wrap}>
      <View style={layout === 'row' ? styles.row : styles.stacked}>
        <Text style={[styles.label, layout === 'row' && styles.rowLabel, { color: color.textDim }]}>{label}</Text>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={color.textFaint}
          {...input}
          style={[
            styles.input,
            layout === 'row' && styles.rowInput,
            { color: color.text, backgroundColor: color.panelRaised, borderColor: invalid ? color.danger : color.panelBorder },
          ]}
        />
        {hint && layout === 'row' && <Text style={[styles.hint, { color: color.textFaint }]}>{hint}</Text>}
      </View>
      {invalid && (
        <View accessibilityLiveRegion="polite" style={styles.error}>
          <View style={[styles.mark, { backgroundColor: color.danger }]}>
            <Text style={[styles.markText, { color: color.onSolid }]}>!</Text>
          </View>
          <Text style={[styles.errorText, { color: color.danger }]}>{error}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: SPACE.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  stacked: { gap: SPACE.md },
  label: { fontSize: FONT.xs, fontWeight: '600' },
  rowLabel: { width: 84 },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xl,
    minHeight: TAP + 4,
    fontSize: FONT.base,
  },
  rowInput: { flex: 1 },
  hint: { fontSize: FONT.xs },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  mark: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  markText: { fontSize: FONT.micro, fontWeight: '700' },
  errorText: { flex: 1, fontSize: FONT.sm, lineHeight: FONT.sm * LINE.snug },
});
