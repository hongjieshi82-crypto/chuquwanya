import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { InnerPageHeader } from '@/components/inner-page-header';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { backOrReplace } from '@/lib/safe-return-to';
import { palette, radii, shadows, spacing, typography } from '@/theme';

export type LegalBlock =
  | { text: string; type: 'heading' }
  | { text: string; type: 'subheading' }
  | { text: string; type: 'paragraph' }
  | { text: string; type: 'item' };

export function LegalDocumentScreen({ blocks, title }: { blocks: LegalBlock[]; title: string }) {
  const router = useRouter();
  const insets = useLayoutInsets();

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}>
        <InnerPageHeader title={title} onBack={() => backOrReplace(router, '/profile')} />

        <View style={styles.documentCard}>
          {blocks.map((block, index) => {
            if (block.type === 'heading') {
              return (
                <Text key={`${block.type}-${index}`} style={styles.heading}>
                  {block.text}
                </Text>
              );
            }

            if (block.type === 'subheading') {
              return (
                <Text key={`${block.type}-${index}`} style={styles.subheading}>
                  {block.text}
                </Text>
              );
            }

            if (block.type === 'item') {
              return (
                <View key={`${block.type}-${index}`} style={styles.itemRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{block.text}</Text>
                </View>
              );
            }

            return (
              <Text key={`${block.type}-${index}`} style={styles.paragraph}>
                {block.text}
              </Text>
            );
          })}
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  documentCard: {
    borderRadius: radii['2xl'],
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  heading: {
    marginTop: spacing.sm,
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 21,
    fontWeight: '700',
  },
  subheading: {
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 21,
    fontWeight: '700',
  },
  paragraph: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '400',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    color: palette.primary,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '400',
  },
});
