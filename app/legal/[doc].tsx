import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEGAL_DOCS, isLegalDocId } from '../../src/shared/legal';
import type { LegalLink, LegalTable } from '../../src/shared/legal/types';
import { FONT, LINE, RADIUS, SPACE, TAP, TRACKING_TIGHT, useAppTheme } from '../../src/presentation/theme';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * One of the shared legal documents — the same words the website shows, file-synced from
 * `src/shared/legal/`. Change them on the web side and run `npm run sync`; this screen only lays
 * them out.
 */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();

  if (!doc || !isLegalDocId(doc)) {
    return (
      <View style={[styles.missing, { backgroundColor: color.bg }]}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={{ color: color.text }}>That page does not exist.</Text>
      </View>
    );
  }

  const legal = LEGAL_DOCS[doc];

  const open = (link: LegalLink) => {
    if ('href' in link) {
      void Linking.openURL(link.href);
      return;
    }
    if (link.route === 'account') router.push('/account');
    else if (link.route === 'pricing') router.push('/pricing');
    else if (link.route === 'reviews') router.push('/reviews');
    else if (link.route !== 'methodology') router.push(`/legal/${link.route}`);
  };

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
    >
      <Stack.Screen options={{ title: legal.title }} />
      <Text accessibilityRole="header" style={[styles.title, { color: color.text }]}>
        {legal.title}
      </Text>
      <Text style={[styles.body, { color: color.textDim }]}>{legal.summary}</Text>
      <Text style={[styles.updated, { color: color.textDim }]}>
        Last updated {DATE.format(new Date(legal.lastUpdated))}
      </Text>

      {legal.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text accessibilityRole="header" style={[styles.heading, { color: color.text }]}>
            {section.heading}
          </Text>
          {section.paragraphs?.map((p) => (
            <Text key={p} style={[styles.body, { color: color.textDim }]}>
              {p}
            </Text>
          ))}
          {section.list?.map((item) => (
            <View key={item} style={styles.listRow}>
              <Text style={[styles.body, { color: color.textDim }]} accessibilityElementsHidden importantForAccessibility="no">
                •
              </Text>
              <Text style={[styles.body, styles.listText, { color: color.textDim }]}>{item}</Text>
            </View>
          ))}
          {section.table && <Table table={section.table} />}
          {section.closing?.map((p) => (
            <Text key={p} style={[styles.body, { color: color.textDim }]}>
              {p}
            </Text>
          ))}
          {/* The methodology page is web-only, so its link has nowhere to go here. */}
          {section.links
            ?.filter((link) => !('route' in link && link.route === 'methodology'))
            .map((link) => (
            <Pressable
              key={link.label}
              accessibilityRole="link"
              onPress={() => open(link)}
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}
            >
              <Text style={[styles.linkText, { color: color.brand }]}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * A table read as rows, not a grid: a five-column table does not fit a phone, and VoiceOver reads
 * a stack of "Heading: value" lines far better than a scrolled grid. Each row is one element so
 * it is announced as a unit.
 */
function Table({ table }: { table: LegalTable }) {
  const { color } = useAppTheme();
  const hasHead = table.head.some((cell) => cell.length > 0);
  return (
    <View style={styles.table}>
      {table.rows.map((row) => (
        <View
          key={row.join('|')}
          accessible
          style={[styles.tableRow, { borderColor: color.panelBorder, backgroundColor: color.panel }]}
        >
          <Text style={[styles.tableTitle, { color: color.text }]}>{row[0]}</Text>
          {row.slice(1).map((cell, i) => (
            <Text key={i} style={[styles.body, { color: color.textDim }]}>
              {hasHead ? `${table.head[i + 1]}: ` : ''}
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACE.xl, gap: SPACE.md },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  updated: { fontSize: FONT.xs },
  section: { gap: SPACE.sm, marginTop: SPACE.lg },
  heading: { fontSize: FONT.base, fontWeight: '700', letterSpacing: TRACKING_TIGHT },
  body: { fontSize: FONT.sm, lineHeight: FONT.sm * LINE.prose },
  listRow: { flexDirection: 'row', gap: SPACE.sm },
  listText: { flex: 1 },
  table: { gap: SPACE.sm },
  tableRow: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.md, gap: SPACE.xs },
  tableTitle: { fontSize: FONT.sm, fontWeight: '700' },
  link: { minHeight: TAP, justifyContent: 'center' },
  linkText: { fontSize: FONT.sm, fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
});
