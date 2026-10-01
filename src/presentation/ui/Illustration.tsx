import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '../theme';

export type IllustrationKind = 'welcome' | 'exam' | 'access' | 'search' | 'error';

interface IllustrationProps {
  kind: IllustrationKind;
  size?: number;
}

/**
 * The spot illustrations the app uses — onboarding, the pricing hero, the empty search, the error
 * screen. The same set, in the same geometry, as the web app's `Illustration` (keep the two in
 * step), drawn with `react-native-svg` from theme colours so each is right in light and dark with
 * no bitmap to ship.
 *
 * Two colours only: `brand` for the drawing, `select` for the one detail meant to catch the eye.
 * Decorative: hidden from VoiceOver, because every screen that shows one says what it is in words.
 */
export function Illustration({ kind, size = 160 }: IllustrationProps) {
  const { color } = useAppTheme();
  const glow = `glow${useId().replace(/[^a-z0-9]/gi, '')}`;
  const stroke = { stroke: color.brand, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const pick = { stroke: color.select, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

  return (
    // Wrapped in a View so it is a positioned, in-flow sibling: on react-native-web a bare <svg> is
    // not, and paints UNDER a `GradientBox`'s absolutely-positioned gradient behind it.
    <View aria-hidden style={{ width: size, height: size }}>
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient id={glow} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color.brand} stopOpacity={0.28} />
          <Stop offset="1" stopColor={color.brand} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="80" cy="80" r="76" fill={`url(#${glow})`} />

      {kind === 'welcome' && (
        <G>
          <Path
            d="M80 118 C52 98 40 82 40 66 C40 52 51 43 63 43 C71 43 77 47 80 53 C83 47 89 43 97 43 C109 43 120 52 120 66 C120 82 108 98 80 118 Z"
            fill={color.panel}
            {...stroke}
          />
          <Path d="M26 84 H58 L66 66 L78 104 L90 58 L98 84 H134" fill="none" {...pick} />
        </G>
      )}
      {kind === 'exam' && (
        <G>
          <Rect x="46" y="36" width="68" height="92" rx="10" fill={color.panel} {...stroke} />
          <Rect x="64" y="28" width="32" height="14" rx="6" fill={color.panel} {...stroke} />
          <Path d="M60 66 L68 74 L82 58" fill="none" {...pick} />
          <Path d="M90 66 H102" fill="none" {...stroke} />
          <Path d="M60 94 H102" fill="none" {...stroke} strokeOpacity={0.5} />
          <Path d="M60 110 H88" fill="none" {...stroke} strokeOpacity={0.5} />
        </G>
      )}
      {kind === 'access' && (
        <G>
          <Path d="M58 72 V56 C58 43 67 36 80 36 C93 36 102 43 102 56" fill="none" {...stroke} />
          <Rect x="44" y="72" width="72" height="54" rx="12" fill={color.panel} {...stroke} />
          <Circle cx="80" cy="98" r="6" fill={color.select} />
          <Path d="M80 104 V114" fill="none" {...pick} />
        </G>
      )}
      {kind === 'search' && (
        <G>
          <Circle cx="72" cy="72" r="30" fill={color.panel} {...stroke} />
          <Path d="M94 94 L122 122" fill="none" {...pick} />
          <Path d="M60 72 H84" fill="none" {...stroke} strokeOpacity={0.5} />
        </G>
      )}
      {kind === 'error' && (
        <G>
          <Rect x="32" y="48" width="96" height="64" rx="12" fill={color.panel} {...stroke} />
          <Path d="M44 82 H66 L74 66 L84 100 L92 82 H116" fill="none" {...pick} strokeOpacity={0.9} />
        </G>
      )}
    </Svg>
    </View>
  );
}
