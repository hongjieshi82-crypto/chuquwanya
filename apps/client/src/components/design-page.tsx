import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppShell } from '@/components/app-shell';
import { BackImageButton } from '@/components/back-image-button';
import { OtterMascot } from '@/components/otter-mascot';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { bottomTabIcons, type BottomTabId } from '@/constants/bottom-tab-icons';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { backOrReplace } from '@/lib/safe-return-to';
import { components, palette, radii, shadows, spacing, typography } from '@/theme';

const invitePosterCharacter = require('../../assets/images/invite/friend-poster-character.png');

type PageMetric = {
  label: string;
  value: string;
  emphasis?: 'raised';
};

type ItemIconName = 'spark' | 'heart' | 'timer' | 'star';

type PageSection = {
  title: string;
  body?: string;
  tag?: string;
  items?: string[];
  itemIcons?: ItemIconName[];
  itemTone?: 'soft';
  titleTone?: 'muted';
  layout?: 'list' | 'date-options' | 'invite-reward';
  defaultSelectedItem?: string;
  tone?: 'default' | 'primary' | 'warm' | 'green' | 'pink' | 'sky';
  emphasis?: 'raised' | 'featured' | 'whiteRaised';
};

type PageAction = {
  label: string;
  href?: Href;
  kind?: 'navigate' | 'copy-invite';
  copiedLabel?: string;
  copyText?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'button' | 'link';
};

export type DesignPageProps = {
  title: string;
  step?: string;
  badge?: string;
  heroTitle: string;
  heroBody?: string;
  heroTitleTone?: 'default' | 'soft';
  heroMascotSource?: ImageSourcePropType;
  metrics?: PageMetric[];
  sections: PageSection[];
  primary?: PageAction;
  secondary?: PageAction;
  showMascot?: boolean;
  showMore?: boolean;
  showBottomTabs?: boolean;
  activeTab?: BottomTabId;
  heroVariant?: 'default' | 'invite-card';
  compactContent?: boolean;
  phonePreview?: boolean;
};

export function DesignBackHeader({
  onBack,
  rightAction = 'none',
  onRightActionPress,
  variant = 'default',
}: {
  title: string;
  step?: string;
  onBack: () => void;
  rightAction?: 'share' | 'none';
  onRightActionPress?: () => void;
  variant?: 'default' | 'invite';
}) {
  const isInvite = variant === 'invite';
  return (
    <View style={[styles.header, isInvite && styles.inviteHeader]}>
      <BackImageButton onPress={onBack} style={styles.headerBackButton} />
      {rightAction !== 'none' && onRightActionPress ? (
        <Pressable
          accessibilityLabel="分享"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRightActionPress}
          style={({ pressed }) => [
            styles.headerActionBtn,
            isInvite && styles.inviteMoreBtn,
            pressed && styles.headerActionPressed,
          ]}>
          <Feather name="share-2" size={18} color={palette.text} />
        </Pressable>
      ) : (
        <View style={styles.headerRightSpacer} />
      )}
    </View>
  );
}

export function DesignBottomTabs({
  active = 'todos',
}: {
  active?: BottomTabId;
}) {
  const router = useRouter();
  const tabs: { id: BottomTabId; label: string; href: Href }[] = [
    { id: 'home', label: '首页', href: '/' as Href },
    { id: 'todos', label: '本周约定', href: '/todos' as Href },
    { id: 'profile', label: '我的', href: '/profile' as Href },
  ];

  return (
    <View style={styles.bottomTab}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        const source = bottomTabIcons[tab.id][selected ? 'active' : 'inactive'];

        return (
          <Pressable
            accessibilityRole="button"
            key={tab.id}
            onPress={() => router.push(tab.href)}
            style={styles.tabItem}>
            <Image resizeMode="contain" source={source} style={styles.tabIcon} />
            <Text style={[styles.tabLabel, selected && styles.tabOn]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DesignPage({
  title,
  step,
  badge,
  heroTitle,
  heroBody,
  heroTitleTone = 'default',
  heroMascotSource,
  metrics = [],
  sections,
  primary,
  secondary,
  showMascot = true,
  showMore = true,
  showBottomTabs = false,
  activeTab = 'todos',
  heroVariant = 'default',
  compactContent = false,
  phonePreview = false,
}: DesignPageProps) {
  const router = useRouter();
  const insets = useLayoutInsets();
  const [copyInviteSuccess, setCopyInviteSuccess] = useState(false);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dateSelections, setDateSelections] = useState<Record<string, string>>(() => {
    const selections: Record<string, string> = {};

    sections.forEach((section) => {
      if (section.layout === 'date-options' && section.items?.length) {
        selections[section.title] = section.defaultSelectedItem ?? section.items[0];
      }
    });

    return selections;
  });

  useEffect(() => () => {
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
  }, []);

  async function handleAction(action: PageAction) {
    if (action.disabled || action.loading) {
      return;
    }

    if (action.kind === 'copy-invite') {
      const copyText =
        action.copyText ??
        (typeof window !== 'undefined'
          ? window.location.href
          : 'https://wind-far.github.io/lazy2move/invite');

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(copyText).catch(() => undefined);
      }

      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      setCopyInviteSuccess(true);
      copyResetTimerRef.current = setTimeout(() => setCopyInviteSuccess(false), 3000);
      return;
    }

    if (action.onPress) {
      action.onPress();
      return;
    }

    if (action.href) {
      router.push(action.href);
    }
  }

  function handleDateOptionPress(section: PageSection, item: string) {
    setDateSelections((current) => ({
      ...current,
      [section.title]: item,
    }));
  }

  return (
    <AppShell
      phonePreview={phonePreview}
      screenTone={heroVariant === 'invite-card' ? 'invite' : 'default'}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.page,
          compactContent && styles.pageCompact,
          heroVariant === 'invite-card' && styles.inviteCardPage,
          {
            paddingBottom: showBottomTabs
              ? insets.tabBarHeight + spacing.xl
              : insets.bottom + spacing['3xl'],
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {heroVariant === 'invite-card' ? (
          <View pointerEvents="none" style={styles.invitePageBackground}>
            {Platform.OS !== 'web' ? (
              <>
                <View style={styles.invitePageWashBlue} />
                <View style={styles.invitePageWashWarm} />
              </>
            ) : null}
          </View>
        ) : null}

        <DesignBackHeader
          title={title}
          step={step}
          onBack={() => backOrReplace(router)}
          rightAction={heroVariant === 'invite-card' && showMore ? 'share' : 'none'}
          variant={heroVariant === 'invite-card' ? 'invite' : 'default'}
        />

        {heroVariant === 'invite-card' ? (
          <View style={styles.inviteHero}>
            {Platform.OS !== 'web' ? (
              <>
                <View style={styles.inviteHeroWashBlue} />
                <View style={styles.inviteHeroWashPurple} />
                <View style={styles.inviteHeroWashWarm} />
              </>
            ) : null}
            <View style={styles.inviteHeroGlow} />
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={invitePosterCharacter}
              style={styles.inviteHeroCharacter}
            />
            <Text style={styles.inviteHeroTitle}>{badge ?? '邀请一个朋友'}</Text>
            <Text style={styles.inviteHeroBody}>{heroTitle}</Text>
          </View>
        ) : (
          <View style={styles.hero}>
            <View style={styles.heroOrbOne} />
            <View style={styles.heroOrbTwo} />
            <View style={styles.heroText}>
              {badge ? <Text style={styles.badge}>{badge}</Text> : null}
              <Text style={[styles.heroTitle, heroTitleTone === 'soft' && styles.heroTitleSoft]}>
                {heroTitle}
              </Text>
              {heroBody ? <Text style={styles.heroBody}>{heroBody}</Text> : null}
            </View>
            {showMascot ? (
              heroMascotSource ? (
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  source={heroMascotSource}
                  style={styles.heroMascotImage}
                />
              ) : (
                <OtterMascot size="sm" style={styles.mascot} />
              )
            ) : null}
          </View>
        )}

        {metrics.length > 0 ? (
          <View style={[styles.metrics, compactContent && styles.metricsCompact]}>
            {metrics.map((metric) => (
              <View
                key={`${metric.label}-${metric.value}`}
                style={[
                  styles.metricCard,
                  metric.emphasis === 'raised' && styles.whiteRaised,
                  compactContent && styles.metricCardCompact,
                ]}>
                <Text style={[styles.metricValue, compactContent && styles.metricValueCompact]}>
                  {metric.value}
                </Text>
                <Text style={[styles.metricLabel, compactContent && styles.metricLabelCompact]}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.sections, compactContent && styles.sectionsCompact]}>
          {sections.map((section) => (
            <View
              key={section.title}
              style={[
                styles.sectionCard,
                section.layout === 'invite-reward'
                  ? [styles.inviteRewardCard, compactContent && styles.inviteRewardCardCompact]
                  : sectionToneStyles[section.tone ?? 'default'],
                section.emphasis === 'raised' && styles.sectionRaised,
                section.emphasis === 'featured' && styles.sectionFeatured,
                section.emphasis === 'whiteRaised' && styles.whiteRaised,
              ]}>
              <View style={styles.sectionHead}>
                <Text
                  style={[
                    styles.sectionTitle,
                    section.titleTone === 'muted' && styles.sectionTitleMuted,
                    compactContent && styles.sectionTitleCompact,
                  ]}>
                  {section.title}
                </Text>
                {section.tag ? <Text style={styles.sectionTag}>{section.tag}</Text> : null}
              </View>
              {section.body ? <Text style={styles.sectionBody}>{section.body}</Text> : null}
              {section.items ? (
                section.layout === 'invite-reward' ? (
                  <View style={[styles.inviteStepList, compactContent && styles.inviteStepListCompact]}>
                    {section.items.map((item, index) => {
                      const step = splitInviteStep(item);

                      return (
                        <View
                          key={item}
                          style={[styles.inviteStepRow, compactContent && styles.inviteStepRowCompact]}>
                          <View
                            style={[
                              styles.inviteStepNumber,
                              compactContent && styles.inviteStepNumberCompact,
                            ]}>
                            <Text
                              style={[
                                styles.inviteStepNumberText,
                                compactContent && styles.inviteStepNumberTextCompact,
                              ]}>
                              {index + 1}
                            </Text>
                          </View>
                          <View style={styles.inviteStepCopy}>
                            <Text
                              style={[
                                styles.inviteStepTitle,
                                compactContent && styles.inviteStepTitleCompact,
                              ]}>
                              {step.title}
                            </Text>
                            <Text
                              style={[
                                styles.inviteStepBody,
                                compactContent && styles.inviteStepBodyCompact,
                              ]}>
                              {step.body}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : section.layout === 'date-options' ? (
                  <View style={styles.dateOptionGrid}>
                    {section.items.map((item) => {
                      const selected = item === dateSelections[section.title];
                      const dateOption = splitDateOption(item);

                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          key={item}
                          onPress={() => handleDateOptionPress(section, item)}
                          style={({ pressed }) => [
                            styles.dateOption,
                            selected && styles.dateOptionSelected,
                            pressed && styles.dateOptionPressed,
                          ]}>
                          <Text
                            style={[
                              styles.dateOptionDay,
                              selected && styles.dateOptionDaySelected,
                            ]}>
                            {dateOption.day}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.dateOptionLabel,
                              selected && styles.dateOptionLabelSelected,
                            ]}>
                            {dateOption.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.itemList}>
                    {section.items.map((item, index) => (
                      <View key={item} style={styles.itemRow}>
                        {section.itemIcons?.[index] ? (
                          <BenefitItemIcon name={section.itemIcons[index]} />
                        ) : (
                          <View style={styles.itemDot} />
                        )}
                        <Text
                          style={[
                            styles.itemText,
                            section.itemTone === 'soft' && styles.itemTextSoft,
                          ]}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                )
              ) : null}
            </View>
          ))}
        </View>

        {primary || secondary ? (
          <View style={[styles.actions, compactContent && styles.actionsCompact]}>
            {secondary ? (
              secondary.variant === 'link' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleAction(secondary)}
                  style={styles.secondaryLink}>
                  <Text style={styles.secondaryLinkText}>{secondary.label}</Text>
                </Pressable>
              ) : compactContent ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: secondary.disabled || secondary.loading }}
                  disabled={secondary.disabled || secondary.loading}
                  onPress={() => void handleAction(secondary)}
                  style={({ pressed }) => [
                    styles.inviteSecondaryButton,
                    pressed &&
                      !secondary.disabled &&
                      !secondary.loading &&
                      styles.inviteSecondaryButtonPressed,
                  ]}>
                  <Text style={styles.inviteSecondaryButtonText}>
                    {secondary.loading ? '请稍候...' : secondary.label}
                  </Text>
                </Pressable>
              ) : (
                <SecondaryButton
                  disabled={secondary.disabled}
                  label={secondary.label}
                  loading={secondary.loading}
                  onPress={() => void handleAction(secondary)}
                />
              )
            ) : null}
            {primary ? (
              primary.kind === 'copy-invite' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: primary.disabled || primary.loading }}
                  disabled={primary.disabled || primary.loading}
                  onPress={() => void handleAction(primary)}
                  style={({ pressed }) => [
                    styles.copyInviteButton,
                    copyInviteSuccess && styles.copyInviteButtonSuccess,
                    pressed && !primary.disabled && !primary.loading && styles.copyInviteButtonPressed,
                  ]}>
                  {copyInviteSuccess ? (
                    <View style={styles.copyInviteButtonContent}>
                      <Text style={styles.copyInviteButtonIcon}>✓</Text>
                      <Text style={styles.copyInviteButtonText}>
                        {primary.copiedLabel ?? '已复制，去分享吧'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.copyInviteButtonText}>
                      {primary.loading ? '请稍候...' : primary.label}
                    </Text>
                  )}
                </Pressable>
              ) : (
                <PrimaryButton
                  disabled={primary.disabled}
                  label={primary.label}
                  loading={primary.loading}
                  onPress={() => void handleAction(primary)}
                />
              )
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      {showBottomTabs ? <DesignBottomTabs active={activeTab} /> : null}
    </AppShell>
  );
}

function splitDateOption(item: string) {
  const [day, ...labelParts] = item.trim().split(/\s+/);

  return {
    day,
    label: labelParts.join(' '),
  };
}

function splitInviteStep(item: string) {
  const commaIndex = item.indexOf('，');

  if (commaIndex === -1) {
    return { title: item, body: '' };
  }

  return {
    title: item.slice(0, commaIndex),
    body: item.slice(commaIndex + 1),
  };
}

function BenefitItemIcon({ name }: { name: ItemIconName }) {
  return (
    <View style={styles.itemIconSlot} pointerEvents="none">
      <Svg width={18} height={18} viewBox="0 0 24 24">
        {name === 'spark' ? (
          <Path
            d="M12 2.8 14.6 9l6.4 2.6-6.4 2.6L12 21.2l-2.6-7-6.4-2.6L9.4 9 12 2.8z"
            fill={palette.primary}
          />
        ) : null}
        {name === 'heart' ? (
          <Path
            d="M12 20.5S4.5 16 4.5 9.9A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3C19.5 16 12 20.5 12 20.5z"
            fill="none"
            stroke={palette.primary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
          />
        ) : null}
        {name === 'timer' ? (
          <Path
            d="M12 6v6l4 2M8 3.5h8M12 3.5v2.2M19.1 8A8.2 8.2 0 1 1 6.6 5.5"
            fill="none"
            stroke={palette.primary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.7}
          />
        ) : null}
        {name === 'star' ? (
          <Path
            d="m12 2.6 2.9 5.9 6.5 1-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-1L12 2.6z"
            fill={palette.primary}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const sectionToneStyles = {
  default: {},
  primary: {
    backgroundColor: palette.primarySoft,
    borderColor: 'rgba(117,101,246,0.16)',
  },
  warm: {
    backgroundColor: palette.duneSoft,
    borderColor: 'rgba(255,211,106,0.36)',
  },
  green: {
    backgroundColor: palette.seafoamSoft,
    borderColor: 'rgba(98,220,168,0.28)',
  },
  pink: {
    backgroundColor: palette.coralSoft,
    borderColor: 'rgba(255,107,142,0.22)',
  },
  sky: {
    backgroundColor: palette.skySoft,
    borderColor: 'rgba(94,172,235,0.24)',
  },
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  page: {
    padding: spacing.lg,
    gap: spacing.lg,
    position: 'relative',
  },
  pageCompact: {
    gap: 8,
  },
  inviteCardPage: {
    paddingTop: 0,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  inviteHeader: {
    minHeight: components.topBarHeight - 2,
    alignItems: 'flex-end',
    position: 'relative',
  },
  headerBackButton: {
    zIndex: 2,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    zIndex: 2,
    ...shadows.card,
  },
  headerRightSpacer: {
    width: 38,
    minWidth: 38,
  },
  headerActionPressed: { opacity: 0.72 },
  inviteMoreBtn: {
    backgroundColor: 'rgba(255,255,255,0.64)',
  },
  hero: {
    minHeight: 210,
    borderRadius: 34,
    padding: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.elevated,
  },
  heroOrbOne: {
    position: 'absolute',
    right: -44,
    top: -46,
    width: 166,
    height: 166,
    borderRadius: 83,
    backgroundColor: 'rgba(121,103,247,0.13)',
  },
  heroOrbTwo: {
    position: 'absolute',
    left: -52,
    bottom: -56,
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: 'rgba(255,181,150,0.26)',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    color: palette.primaryDark,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  heroTitleSoft: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
  },
  heroBody: {
    color: palette.muted,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '700',
  },
  mascot: {
    marginRight: -spacing.sm,
  },
  heroMascotImage: {
    width: 109,
    height: 109,
    marginLeft: spacing.sm,
    marginRight: -spacing.md,
  },
  invitePageBackground: {
    position: 'absolute',
    top: -spacing.lg,
    left: -spacing.lg,
    right: -spacing.lg,
    height: 430,
    overflow: 'hidden',
    backgroundColor: '#E9F6FF',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'linear-gradient(180deg, rgba(243,240,255,0) 72%, #F3F0FF 100%), radial-gradient(ellipse at 51% 31%, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.36) 28%, rgba(255,255,255,0) 58%), linear-gradient(112deg, #D8F5FF 0%, #E9F1FF 43%, #FFF4CC 100%)',
        } as const)
      : {}),
  },
  invitePageWashBlue: {
    position: 'absolute',
    left: -74,
    top: -48,
    width: '72%',
    height: 390,
    borderBottomRightRadius: 190,
    backgroundColor: 'rgba(213,244,255,0.62)',
    transform: [{ rotate: '-4deg' }],
  },
  invitePageWashWarm: {
    position: 'absolute',
    right: -82,
    top: -46,
    width: '72%',
    height: 390,
    borderBottomLeftRadius: 190,
    backgroundColor: 'rgba(255,247,214,0.68)',
    transform: [{ rotate: '4deg' }],
  },
  inviteHero: {
    position: 'relative',
    width: '100%',
    minHeight: 220,
    maxHeight: 236,
    borderRadius: 29,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: '#EEF2FF',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(circle at 50% 34%, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.30) 24%, rgba(255,255,255,0) 49%), linear-gradient(135deg, rgba(210,246,255,0.84) 0%, rgba(230,235,255,0.82) 46%, rgba(255,246,210,0.92) 100%)',
        } as const)
      : {}),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    ...shadows.elevated,
  },
  inviteHeroWashBlue: {
    position: 'absolute',
    left: -28,
    top: -24,
    width: '58%',
    height: '110%',
    borderRadius: 48,
    backgroundColor: 'rgba(211,246,255,0.72)',
  },
  inviteHeroWashPurple: {
    position: 'absolute',
    right: -36,
    top: -22,
    width: '74%',
    height: '90%',
    borderRadius: 52,
    backgroundColor: 'rgba(234,228,255,0.72)',
  },
  inviteHeroWashWarm: {
    position: 'absolute',
    right: -28,
    bottom: -18,
    width: '75%',
    height: '61%',
    borderRadius: 50,
    backgroundColor: 'rgba(255,247,212,0.88)',
  },
  inviteHeroGlow: {
    position: 'absolute',
    top: '10%',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  inviteHeroCharacter: {
    position: 'absolute',
    top: 10,
    width: 154,
    height: 142,
    zIndex: 1,
    transform: [{ scale: 1.2 }],
  },
  inviteHeroTitle: {
    position: 'relative',
    zIndex: 2,
    color: palette.ink,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  inviteHeroBody: {
    position: 'relative',
    zIndex: 2,
    marginTop: 4,
    color: palette.muted,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricsCompact: {
    gap: spacing.sm,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 78,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
    padding: spacing.md,
    justifyContent: 'center',
    ...shadows.card,
  },
  metricCardCompact: {
    minHeight: 46,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  metricValue: {
    color: palette.ink,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  metricValueCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  metricLabel: {
    marginTop: spacing.xs,
    color: palette.muted,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  metricLabelCompact: {
    marginTop: 2,
    fontSize: 10,
  },
  sections: {
    gap: spacing.md,
  },
  sectionsCompact: {
    gap: spacing.sm,
  },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionRaised: {
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#8674FF',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  sectionFeatured: {
    backgroundColor: '#FFF0EA',
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#B8A8FF',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  whiteRaised: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#B8A8FF',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  inviteRewardCard: {
    minHeight: 176,
    borderRadius: 34,
    backgroundColor: palette.surface,
    borderColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  inviteRewardCardCompact: {
    minHeight: 112,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    color: palette.ink,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  sectionTitleMuted: {
    color: palette.muted,
  },
  sectionTitleCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  sectionTag: {
    color: palette.primary,
    backgroundColor: 'rgba(255,255,255,0.66)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    fontSize: 11,
    fontWeight: '900',
  },
  sectionBody: {
    marginTop: spacing.sm,
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '700',
  },
  dateOptionGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateOption: {
    flex: 1,
    minWidth: 0,
    height: 64,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dateOptionSelected: {
    backgroundColor: palette.white,
    borderColor: palette.borderStrong,
    ...shadows.card,
  },
  dateOptionPressed: {
    opacity: 0.78,
  },
  dateOptionDay: {
    color: palette.muted,
    fontSize: 21,
    lineHeight: 23,
    fontWeight: '900',
  },
  dateOptionDaySelected: {
    color: palette.primaryDark,
  },
  dateOptionLabel: {
    color: palette.muted,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
  },
  dateOptionLabelSelected: {
    color: palette.primaryDark,
  },
  itemList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: palette.primary,
  },
  itemIconSlot: {
    width: 7,
    height: 18,
    marginTop: 2,
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '700',
  },
  itemTextSoft: {
    color: 'rgba(63,58,98,0.88)',
    fontWeight: '600',
  },
  inviteStepList: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  inviteStepListCompact: {
    marginTop: 8,
    gap: 8,
  },
  inviteStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  inviteStepRowCompact: {
    gap: spacing.sm,
  },
  inviteStepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  inviteStepNumberCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  inviteStepNumberText: {
    color: palette.white,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  inviteStepNumberTextCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  inviteStepCopy: {
    flex: 1,
    minWidth: 0,
  },
  inviteStepTitle: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  inviteStepTitleCompact: {
    fontSize: 13,
    lineHeight: 19,
  },
  inviteStepBody: {
    marginTop: 2,
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  inviteStepBodyCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    gap: spacing.md,
  },
  actionsCompact: {
    gap: spacing.md,
  },
  secondaryLink: {
    minHeight: 30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  secondaryLinkText: {
    color: palette.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '900',
  },
  inviteSecondaryButton: {
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteSecondaryButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  inviteSecondaryButtonText: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '900',
  },
  copyInviteButton: {
    minHeight: 54,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    ...shadows.primaryButton,
  },
  copyInviteButtonSuccess: {
    backgroundColor: palette.primaryLight,
  },
  copyInviteButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
  copyInviteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  copyInviteButtonIcon: {
    color: palette.white,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  copyInviteButtonText: {
    color: palette.white,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '900',
  },
  bottomTab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 10,
    height: 66,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.tabBar,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    color: palette.placeholder,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  tabOn: {
    color: palette.primary,
  },
});
