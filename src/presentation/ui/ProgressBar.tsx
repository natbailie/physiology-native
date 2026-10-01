import { StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, useAppTheme } from '../theme';
import { GradientBox } from './GradientBox';

interface ProgressBarProps {
  value: number;
  max: number;
  /** What is being counted, for the accessible name: "Questions known". */
  label: string;
  /** Show "value/max" beside the bar, so the state never rests on the fill alone. */
  showCount?: boolean;
  height?: number;
}

/** A slim gradient progress bar with the numbers available as text and to VoiceOver. */
export function ProgressBar({ value, max, label, showCount = false, height = 8 }: ProgressBarProps) {
  const { color } = useAppTheme();
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), Math.max(max, 0));
  const pct = (clamped / safeMax) * 100;

  return (
    <View style={styles.row}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={`${clamped} of ${max}`}
        style={[styles.track, { height, backgroundColor: color.panelRaised, borderColor: color.panelBorder }]}
      >
        {pct > 0 && (
          <GradientBox
            colors={[color.brandDeep, color.brand]}
            direction="horizontal"
            style={{ width: `${pct}%`, height: '100%', borderRadius: RADIUS.pill }}
          />
        )}
      </View>
      {showCount && (
        <Text style={[styles.count, { color: color.textDim }]}>
          {clamped}/{max}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  track: { flex: 1, borderRadius: RADIUS.pill, borderWidth: 1, overflow: 'hidden' },
  count: { fontSize: FONT.micro, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
