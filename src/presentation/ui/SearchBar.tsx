import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { FONT, RADIUS, SPACE, TAP, useAppTheme } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Says what to type, with an example: "Try “cardiac output” or “ABG”". */
  placeholder: string;
  accessibilityLabel: string;
}

/**
 * A search field that sits inside a scrolling screen rather than replacing it: type to filter, or
 * ignore it and keep scrolling. Put it in the scroll content and give the `ScrollView`
 * `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="on-drag"`, so a drag down the
 * list dismisses the keyboard and a tap on a result still lands on the first press.
 */
export function SearchBar({ value, onChangeText, placeholder, accessibilityLabel }: SearchBarProps) {
  const { color } = useAppTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>
      <Ionicons name="search" size={18} color={color.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.textFaint}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        style={[styles.input, { color: color.text }]}
      />
      {value !== '' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clear}
        >
          <Ionicons name="close-circle" size={20} color={color.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    minHeight: TAP + 8,
    paddingHorizontal: SPACE.xl,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
  },
  input: { flex: 1, fontSize: FONT.base, minHeight: TAP },
  clear: { width: TAP - 8, height: TAP - 8, alignItems: 'center', justifyContent: 'center' },
});
