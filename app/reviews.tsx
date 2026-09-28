import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthContext';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { BUSINESS } from '../src/shared/legal/business';
import {
  MODERATION_POLICY,
  REVIEW_BODY_MAX,
  REVIEW_NAME_MAX,
  deleteOwnReview,
  fetchOwnReview,
  fetchPublishedReviews,
  saveReview,
  summarise,
  type OwnReview,
  type PublishedReview,
} from '../src/shared/reviews/reviews';
import { KeyboardAwareScroll } from '../src/presentation/KeyboardAwareScroll';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../src/presentation/theme';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Reviews — the same rows, rules and moderation policy as the website's #reviews page, through
 * the synced `src/shared/reviews/reviews.ts`. The average is computed from published rows; there
 * are no sample reviews, and an empty list says so.
 */
export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  const [reviews, setReviews] = useState<PublishedReview[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    void fetchPublishedReviews().then((rows) => {
      if (rows) setReviews(rows);
      else setFailed(true);
    });
  }, []);

  useEffect(load, [load]);

  const summary = summarise(reviews ?? []);

  return (
    <KeyboardAwareScroll
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: 'Reviews' }} />

      <Card>
        <Heading>Summary</Heading>
        {!isSupabaseConfigured ? (
          <Body>Reviews are not available in this build.</Body>
        ) : failed ? (
          <Body>Reviews could not be loaded just now. Try again later.</Body>
        ) : reviews === null ? (
          <Body>Loading reviews…</Body>
        ) : summary.count === 0 ? (
          <Body>No reviews have been published yet. Be the first to write one.</Body>
        ) : (
          <Text accessible style={[styles.average, { color: color.text }]}>
            {summary.average?.toFixed(1)} out of 5
            <Text style={[styles.body, { color: color.textDim }]}>
              {'  '}from {summary.count} review{summary.count === 1 ? '' : 's'}
            </Text>
          </Text>
        )}
      </Card>

      {reviews?.map((review) => (
        <Card key={review.id}>
          <Text
            accessibilityLabel={`${review.rating} out of 5 stars`}
            style={[styles.stars, { color: color.brand }]}
          >
            {'★'.repeat(review.rating)}
            <Text style={{ color: color.textFaint }}>{'★'.repeat(5 - review.rating)}</Text>
          </Text>
          <Text style={[styles.reviewBody, { color: color.text }]}>{review.body}</Text>
          <Body>
            {review.displayName ?? 'A learner'} · {DATE.format(new Date(review.createdAt))}
          </Body>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void Linking.openURL(
                `mailto:${BUSINESS.contactEmail}?subject=${encodeURIComponent(`Report review ${review.id}`)}`,
              )
            }
            style={styles.linkRow}
          >
            <Text style={[styles.link, { color: color.textDim }]}>Report this review</Text>
          </Pressable>
        </Card>
      ))}

      {isSupabaseConfigured && <WriteReview onSaved={load} />}

      <Card>
        <Heading>How reviews work</Heading>
        {MODERATION_POLICY.map((line) => (
          <Body key={line}>• {line}</Body>
        ))}
      </Card>
    </KeyboardAwareScroll>
  );
}

function WriteReview({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const { color } = useAppTheme();
  const [own, setOwn] = useState<OwnReview | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchOwnReview(user.id).then((existing) => {
      if (cancelled) return;
      setOwn(existing);
      if (existing) {
        setRating(existing.rating);
        setBody(existing.body);
        setDisplayName(existing.displayName ?? '');
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const say = (text: string, error: boolean) => {
    setMessage({ text, error });
    AccessibilityInfo.announceForAccessibility(text);
  };

  if (!user) {
    return (
      <Card>
        <Heading>Write a review</Heading>
        <Body>Sign in on the Account tab to write a review.</Body>
        <Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={styles.linkRow}>
          <Text style={[styles.link, { color: color.brand }]}>Go to Account</Text>
        </Pressable>
      </Card>
    );
  }

  const submit = async () => {
    setBusy(true);
    const result = await saveReview(user.id, { rating, body, displayName }, own !== null);
    setBusy(false);
    if (!result.ok) {
      say(result.message, true);
      return;
    }
    setOwn({ rating, body: body.trim(), displayName: displayName.trim() || null, status: 'pending', rejectionReason: null });
    say('Thank you. Your review will appear once it has been checked.', false);
    onSaved();
  };

  const remove = async () => {
    setBusy(true);
    const result = await deleteOwnReview(user.id);
    setBusy(false);
    if (!result.ok) {
      say(result.message, true);
      return;
    }
    setOwn(null);
    setRating(0);
    setBody('');
    setDisplayName('');
    say('Your review has been deleted.', false);
    onSaved();
  };

  return (
    <Card>
      <Heading>{own ? 'Your review' : 'Write a review'}</Heading>
      {own && (
        <Body>
          {own.status === 'published'
            ? 'Your review is published. Editing it sends it back to be checked again.'
            : own.status === 'pending'
              ? 'Your review is waiting to be checked.'
              : `Your review was not published${own.rejectionReason ? `: ${own.rejectionReason}` : ''}. You can edit it and send it again.`}
        </Body>
      )}
      {!loaded ? (
        <Body>Loading…</Body>
      ) : (
        <>
          <Text style={[styles.label, { color: color.text }]}>Your rating</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Your rating" style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                accessibilityRole="radio"
                accessibilityState={{ checked: rating === star }}
                accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
                onPress={() => setRating(star)}
                style={[
                  styles.star,
                  { borderColor: rating === star ? color.brand : color.panelBorder, backgroundColor: color.panel },
                ]}
              >
                <Text style={[styles.starText, { color: star <= rating ? color.brand : color.textFaint }]}>★</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: color.text }]}>Your review</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={REVIEW_BODY_MAX}
            accessibilityLabel="Your review"
            accessibilityHint={`Your own experience, 10 to ${REVIEW_BODY_MAX} characters. No personal details.`}
            placeholder="What was useful, and what wasn't?"
            placeholderTextColor={color.textFaint}
            style={[styles.input, styles.textarea, { borderColor: color.panelBorder, color: color.text }]}
          />

          <Text style={[styles.label, { color: color.text }]}>Name to show (optional)</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={REVIEW_NAME_MAX}
            accessibilityLabel="Name to show, optional"
            accessibilityHint="Leave blank to appear as A learner"
            autoComplete="nickname"
            placeholder="A learner"
            placeholderTextColor={color.textFaint}
            style={[styles.input, { borderColor: color.panelBorder, color: color.text }]}
          />

          {message && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.message, { color: message.error ? color.danger : color.text }]}
            >
              {message.error ? 'Error: ' : ''}
              {message.text}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => void submit()}
            style={({ pressed }) => [styles.primary, { backgroundColor: color.brand }, (pressed || busy) && styles.pressed]}
          >
            <Text style={[styles.primaryText, { color: color.onSolid }]}>
              {busy ? 'Saving…' : own ? 'Update review' : 'Submit review'}
            </Text>
          </Pressable>
          {own && (
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void remove()} style={styles.linkRow}>
              <Text style={[styles.link, { color: color.danger }]}>Delete my review</Text>
            </Pressable>
          )}
        </>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.panelBorder }]}>{children}</View>;
}

function Heading({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return (
    <Text accessibilityRole="header" style={[styles.heading, { color: color.text }]}>
      {children}
    </Text>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  const { color } = useAppTheme();
  return <Text style={[styles.body, { color: color.textDim }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  content: { padding: SPACE.xl, gap: SPACE.lg },
  card: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.xl, gap: SPACE.md },
  heading: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  body: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  average: { fontSize: FONT.xl, fontWeight: '700' },
  stars: { fontSize: FONT.base, letterSpacing: 2 },
  reviewBody: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  linkRow: { minHeight: TAP, justifyContent: 'center' },
  link: { fontSize: FONT.sm, fontWeight: '700', textDecorationLine: 'underline' },
  label: { fontSize: FONT.sm, fontWeight: '700', marginTop: SPACE.sm },
  ratingRow: { flexDirection: 'row', gap: SPACE.sm },
  star: {
    minWidth: TAP,
    minHeight: TAP,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: { fontSize: FONT.lg },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.lg, minHeight: TAP, fontSize: FONT.base },
  textarea: { minHeight: 120, paddingTop: SPACE.md, textAlignVertical: 'top' },
  message: { fontSize: FONT.sm },
  primary: { minHeight: TAP, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: FONT.base, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
