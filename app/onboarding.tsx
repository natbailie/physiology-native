import { Stack, useRouter } from 'expo-router';
import { Logo } from '../src/presentation/ui/Logo';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExamProfile } from '../src/account/examProfile';
import { FREE_MODULE_IDS } from '../src/billing/config';
import { setExamFilter } from '../src/home/examFilter';
import { EXAMS, type ExamId } from '../src/home/exams';
import { MODULES } from '../src/home/moduleRegistry';
import { completeOnboarding } from '../src/onboarding/onboardingStore';
import { selectionTick } from '../src/presentation/haptics';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../src/presentation/theme';
import { Button } from '../src/presentation/ui/Button';
import { GradientBox } from '../src/presentation/ui/GradientBox';
import { Illustration } from '../src/presentation/ui/Illustration';
import { ProgressBar } from '../src/presentation/ui/ProgressBar';

const SIMULATORS = MODULES.filter((module) => module.kind !== 'reference' && module.status === 'available');
const FREE = SIMULATORS.filter((module) => FREE_MODULE_IDS.has(module.id));

const PAGES = 3;

/**
 * The first-run walkthrough: three swipeable screens, a progress bar, Skip on every one, and a
 * single full-width call to action pinned where the thumb already is.
 *
 *   1. what this is          2. what you are revising for (one tap, optional)     3. what is free
 *
 * Kept to three because a walkthrough is a toll: each screen must earn it. The middle one is the only
 * question, and it is a single tap on a chip — "Not sure yet" is a real answer — because the answer
 * does real work (it filters the catalogue) and a learner who skips it loses nothing.
 *
 * Skip and finish do the same thing; see `onboardingStore`.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { color } = useAppTheme();
  const { canSave, save, trainingLevel } = useExamProfile();

  const scroll = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [exam, setExam] = useState<ExamId | 'notSure' | null>(null);

  const last = page === PAGES - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/');
  };

  const goTo = (next: number) => {
    scroll.current?.scrollTo({ x: next * width, animated: true });
    setPage(next);
  };

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const choose = (next: ExamId | 'notSure') => {
    selectionTick();
    setExam(next);
    // The catalogue answers the tap straight away; saving to the profile is best-effort and only
    // possible when signed in, which most people are not yet.
    setExamFilter(next === 'notSure' ? null : next);
    if (canSave) void save({ targetExam: next === 'notSure' ? null : next, trainingLevel });
  };

  return (
    <View style={[styles.root, { backgroundColor: color.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <View style={styles.top}>
        <View style={styles.progress}>
          <ProgressBar value={page + 1} max={PAGES} label={`Step ${page + 1} of ${PAGES}`} />
          <Text style={[styles.step, { color: color.textFaint }]}>
            {page + 1} of {PAGES}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          onPress={finish}
          hitSlop={8}
          style={styles.skip}
        >
          <Text style={[styles.skipText, { color: color.textDim }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onSettle}
        style={styles.pager}
      >
        <Page width={width}>
          <Hero>
            <Logo size={96} />
          </Hero>
          <Title>Learn physiology by playing with it</Title>
          <Body>
            Drag a slider and watch the body respond. {SIMULATORS.length} live simulators, each followed by
            exam-style questions that explain every answer.
          </Body>
        </Page>

        <Page width={width}>
          <Hero>
            <Illustration kind="exam" size={176} />
          </Hero>
          <Title>What are you revising for?</Title>
          <Body>Tap one and we will put the most useful simulators first. You can change it any time.</Body>
          <View style={styles.chips}>
            {EXAMS.map((item) => (
              <Chip key={item.id} label={item.name} selected={exam === item.id} onPress={() => choose(item.id)} />
            ))}
            <Chip label="Not sure yet" selected={exam === 'notSure'} onPress={() => choose('notSure')} />
          </View>
        </Page>

        <Page width={width}>
          <Hero>
            <Illustration kind="access" size={176} />
          </Hero>
          <Title>Start free, unlock more when you are ready</Title>
          <Body>
            {FREE.length} simulators are free on any account, questions included:{' '}
            {FREE.map((module) => module.name).join(', ')}. Full access opens the rest, and you can look at plans
            any time from the Account tab.
          </Body>
        </Page>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + SPACE.xl }]}>
        <Button
          label={last ? 'Get started' : 'Continue'}
          onPress={() => (last ? finish() : goTo(page + 1))}
        />
      </View>
    </View>
  );
}

function Page({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <ScrollView style={{ width }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

/** The gradient banner each page opens on, with the illustration overlapping its lower edge. */
function Hero({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return (
    <View style={styles.heroWrap}>
      <GradientBox colors={[color.brandInk, color.brandDeep]} style={styles.hero} />
      <View style={styles.heroArt}>{children}</View>
    </View>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: color.text }]}>
      {children}
    </Text>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return <Text style={[styles.body, { color: color.textDim }]}>{children}</Text>;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { color } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
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
}

const HERO_HEIGHT = 168;

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xl, paddingHorizontal: SPACE.xl, minHeight: TAP + SPACE.lg },
  progress: { flex: 1, gap: SPACE.sm },
  step: { fontSize: FONT.micro, fontWeight: '700' },
  skip: { minWidth: TAP, minHeight: TAP, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontSize: FONT.base, fontWeight: '700' },
  pager: { flex: 1 },
  page: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xxl, gap: SPACE.xl },
  heroWrap: { height: HERO_HEIGHT + 72, marginBottom: SPACE.md },
  hero: { height: HERO_HEIGHT, borderRadius: RADIUS.lg },
  // Hangs over the banner's bottom edge (top 56 + 176 tall vs a 168 banner), so art and banner
  // read as one object instead of a picture inside a box.
  heroArt: { position: 'absolute', left: 0, right: 0, top: 56, alignItems: 'center' },
  title: { fontSize: FONT.xxl, fontWeight: '700', letterSpacing: TRACKING_TIGHT, lineHeight: FONT.xxl * LINE.tight },
  body: { fontSize: FONT.base, lineHeight: FONT.base * LINE.prose },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.lg },
  chip: {
    minHeight: TAP + 4,
    paddingHorizontal: SPACE.xxl,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.pill,
  },
  chipText: { fontSize: FONT.sm, fontWeight: '700' },
  bottom: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg },
});
