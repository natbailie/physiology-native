/**
 * Transport for simulated time: play/pause, a single step, and the speed multiplier.
 *
 * The native app had none of this — every module played at its own `timeScale` from mount and
 * there was no way to stop it. Pausing is what makes the readouts readable at all (several
 * modules move faster than a number can be read), and it is also what makes the dock's
 * always-visible bar worth having rather than a strip with a chevron in it.
 *
 * Two rows rather than the web's one: a Pause button, five speed chips and the Controls handle
 * do not fit across a 375pt phone.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SegmentedControl } from './SegmentedControl';
import { SPEED_OPTIONS, type NativeSimTransport } from '../hooks/useNativeEngineLoop';
import { FONT, RADIUS, SPACE, TAP, useAppTheme, withAlpha } from './theme';
import { selectionTick } from './haptics';

const SPEED_SEGMENTS = SPEED_OPTIONS.map((option) => ({
  value: String(option),
  label: `${option}x`,
}));

interface SimControlsProps {
  transport: NativeSimTransport;
  /** The module's accent, so the transport reads as part of the module rather than as chrome. */
  accent: string;
  /** Whether the slider tray below is raised. Omit `onToggle` on a module with no controls. */
  open?: boolean;
  onToggle?: () => void;
}

export function SimControls({ transport, accent, open = false, onToggle }: SimControlsProps) {
  const { color } = useAppTheme();
  const { playing, speed, toggle, stepOnce, setSpeed } = transport;

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            selectionTick();
            toggle();
          }}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause simulation' : 'Play simulation'}
          style={({ pressed }) => [
            styles.play,
            { backgroundColor: accent },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.playText, { color: color.onSolid }]}>
            {playing ? '❚❚  Pause' : '▶  Play'}
          </Text>
        </Pressable>

        {/* Only while paused. The web disables it instead, but a permanently dead button is a
            worse use of a phone-width bar than one that appears when it becomes usable. */}
        {!playing && (
          <Pressable
            onPress={() => {
              selectionTick();
              stepOnce();
            }}
            accessibilityRole="button"
            accessibilityLabel="Advance a short slice of time"
            style={({ pressed }) => [
              styles.step,
              { backgroundColor: withAlpha(accent, 0.12) },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.stepText, { color: accent }]}>Step</Text>
          </Pressable>
        )}

        {onToggle && (
          <Pressable
            onPress={() => {
              selectionTick();
              onToggle();
            }}
            accessibilityRole="button"
            accessibilityLabel={open ? 'Hide controls' : 'Show controls'}
            accessibilityState={{ expanded: open }}
            style={({ pressed }) => [styles.handle, pressed && styles.pressed]}
          >
            <Text style={[styles.handleText, { color: color.text }]}>Controls</Text>
            <Text style={[styles.chevron, { color: color.textFaint }]}>{open ? '▾' : '▴'}</Text>
          </Pressable>
        )}
      </View>

      <SegmentedControl
        segments={SPEED_SEGMENTS}
        value={String(speed)}
        onChange={(value) => setSpeed(Number(value))}
        accent={accent}
        accessibilityLabel="Simulation speed"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { gap: SPACE.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  pressed: { opacity: 0.6 },
  play: {
    borderRadius: RADIUS.sm,
    minHeight: TAP - 8,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  playText: { fontSize: FONT.xs, fontWeight: '700' },
  step: {
    borderRadius: RADIUS.sm,
    minHeight: TAP - 8,
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
  },
  stepText: { fontSize: FONT.xs, fontWeight: '700' },
  // Pushed to the trailing edge, which is where the web puts it and where a thumb reaches.
  handle: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    minHeight: TAP - 8,
    paddingHorizontal: SPACE.sm,
  },
  handleText: { fontSize: FONT.xs, fontWeight: '600' },
  chevron: { fontSize: FONT.micro },
});
