import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { FONT, RADIUS, SHADOW, SPACE, TAP, useAppTheme } from '../theme';
import { selectionTick } from '../haptics';
import { GradientBox } from './GradientBox';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** A spinner in place of the icon, and presses are ignored. The label stays: it says what is happening. */
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Full width is the default for every call to action; pass false for an inline control. */
  fullWidth?: boolean;
  role?: 'button' | 'link';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The app's one button.
 *
 * `primary` is the ONE call to action on a screen or card — a brand-to-deep gradient, full width,
 * 52pt tall (well over the 44pt floor), so it is the obvious thumb target. `secondary` is the
 * outlined alternative beside it; `ghost` is a quiet text action (skip, restore, read the terms) that
 * still keeps a 44pt hit area; `danger` is for the destructive confirm.
 *
 * It replaces the ad-hoc `primary` Pressable and `GhostButton` each screen carried its own copy of.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  role = 'button',
  style,
  testID,
}: ButtonProps) {
  const { color } = useAppTheme();
  const inactive = disabled || loading;

  const ink =
    variant === 'primary' ? color.onSolid : variant === 'danger' ? color.danger : variant === 'ghost' ? color.brand : color.brand;

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator size="small" color={ink} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={ink} />
      ) : null}
      <Text style={[styles.label, { color: ink }]}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole={role}
      accessibilityState={{ disabled: inactive }}
      aria-busy={loading}
      accessibilityLabel={label}
      disabled={inactive}
      onPress={() => {
        selectionTick();
        onPress();
      }}
      style={({ pressed }) => [
        fullWidth ? styles.full : styles.inline,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <GradientBox colors={[color.brand, color.brandDeep]} style={[styles.surface, styles.primary, SHADOW.raised]}>
          {content}
        </GradientBox>
      ) : (
        <View
          style={[
            styles.surface,
            variant === 'secondary' && { borderWidth: 1.5, borderColor: color.brand, backgroundColor: color.panel },
            variant === 'danger' && { borderWidth: 1.5, borderColor: color.danger },
            variant === 'ghost' && styles.ghost,
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  surface: {
    minHeight: TAP,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { minHeight: 52 },
  ghost: { paddingHorizontal: SPACE.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.md },
  label: { fontSize: FONT.base, fontWeight: '700' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  inactive: { opacity: 0.5 },
});
