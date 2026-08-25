import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppShell } from '@/components/app-shell';
import { AppIcon } from '@/components/app-icon';
import { AmapView } from '@/components/amap-view';
import { BottomSheet } from '@/components/bottom-sheet';
import { DesignBackHeader } from '@/components/design-page';
import { ErrorCard } from '@/components/error-card';
import { useApp } from '@/contexts/app-context';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { requestDeviceCurrentPosition } from '@/lib/device-location';
import { resolveAddressLocation, resolveCoordinatesAddress } from '@/lib/reverse-geocode';
import { backOrReplace } from '@/lib/safe-return-to';
import { palette, radii, shadows, spacing, typography } from '@/theme';
import type { City, Preferences } from '@/types';

const DEFAULT_RANDOM_LEVEL = 68;
const RANDOM_THUMB_SIZE = 20;

const DEFAULT_PREFERENCES: Preferences = {
  partySize: 1,
  durationMinutes: null,
  budgetMax: 50,
  mood: '放松',
  randomLevel: DEFAULT_RANDOM_LEVEL,
  category: '不限',
  environment: 'either',
  radiusKm: null,
  destinationScope: 'nearby',
};

const BUDGET_OPTIONS: ChipOption<number | null>[] = [
  { label: '0-50元', value: 50 },
  { label: '50-100元', value: 100 },
  { label: '100元以上', value: null },
];

const MOOD_OPTIONS: ChipOption<string>[] = ['放松', '探索', '热闹'].map((value) => ({
  label: value,
  value,
}));

const MASCOT_MOON = require('../../assets/images/mascot-moon.png');
const REVEAL_VIDEO = require('../../assets/videos/reveal-transition.mp4');
const REVEAL_VIDEO_BG = '#F7F2EA';
const DEFAULT_ORIGIN_LABEL = '当前位置 / 手动输入';
const LOCATION_PENDING_LABEL = '点击后获取设备当前位置';
const DEVICE_ORIGIN_LABEL = '当前位置';

const DESIGN_WIDTH = 375;
const CARD_BUTTON_GAP = 40;
const REVEAL_VIDEO_ASPECT_RATIO = 0.7;
const REVEAL_VIDEO_MAX_WIDTH = 354;
const REVEAL_OVERLAY_VERTICAL_RESERVE = 128;
const REVEAL_VIDEO_TIMEOUT_MS = 4600;
const MIN_LAYOUT_WIDTH = 320;
const MAX_LAYOUT_WIDTH = 430;
const ORIGIN_INPUT_MIN_HEIGHT = 48;
const ORIGIN_INPUT_MAX_HEIGHT = 128;
const ORIGIN_INPUT_VERTICAL_PADDING = 24;

type ChipOption<T extends string | number | null> = {
  label: string;
  value: T;
};

type OriginLocationCandidate = {
  name: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  source: NonNullable<Preferences['originSource']>;
};

type RevealRequestStatus = 'idle' | 'pending' | 'success' | 'error';

type PcBlindboxParams = {
  source?: string;
  partySize?: string;
  budgetMax?: string;
  mood?: string;
  randomLevel?: string;
  radiusKm?: string;
  destinationScope?: string;
  originName?: string;
  originLatitude?: string;
  originLongitude?: string;
  originAccuracyMeters?: string;
  originSource?: string;
};

function parseFiniteParam(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableNumberParam(value: string | undefined) {
  return value === 'none' ? null : parseFiniteParam(value);
}

function scaleFromDesignWidth(value: number, width: number) {
  const layoutWidth = Math.min(Math.max(width, MIN_LAYOUT_WIDTH), MAX_LAYOUT_WIDTH);
  return Math.round((value * layoutWidth) / DESIGN_WIDTH);
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function normalizeCityText(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, '');
}

function cityMatchTokens(city: City) {
  const rawTokens = [
    city.name,
    `${city.name}市`,
    city.province,
    `${city.province}市`,
    city.code,
  ];
  return Array.from(new Set(rawTokens.map(normalizeCityText).filter((token) => token.length > 1)));
}

function findCityIdForOriginName(originName: string, cities: City[]) {
  const normalizedOrigin = normalizeCityText(originName);
  const matchedCity = cities.find((city) =>
    cityMatchTokens(city).some((token) => normalizedOrigin.includes(token)),
  );

  return matchedCity?.id ?? null;
}

export default function PreferencesScreen() {
  const router = useRouter();
  const pcParams = useLocalSearchParams<PcBlindboxParams>();
  const { options, cities, selectedCityId, setSelectedCityId, startDraw, error, clearError } = useApp();
  const { bottom } = useLayoutInsets();
  const { height, width } = useWindowDimensions();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isOriginSheetVisible, setIsOriginSheetVisible] = useState(false);
  const [originDraft, setOriginDraft] = useState('');
  const [locatedOrigin, setLocatedOrigin] = useState<OriginLocationCandidate | null>(null);
  const [originError, setOriginError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingOrigin, setIsResolvingOrigin] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRevealVideoVisible, setIsRevealVideoVisible] = useState(false);
  const [revealPlaybackKey, setRevealPlaybackKey] = useState(0);
  const [revealRequestStatus, setRevealRequestStatus] = useState<RevealRequestStatus>('idle');
  const originResolveRequestRef = useRef(0);
  const revealRequestStatusRef = useRef<RevealRequestStatus>('idle');
  const didApplyPcBlindboxRef = useRef(false);
  const cardButtonGap = scaleFromDesignWidth(CARD_BUTTON_GAP, width);
  const isCompactHeight = height <= 820;
  const originName = preferences.originName?.trim() ?? '';
  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? cities[0];
  const selectedCityName = selectedCity?.name ?? null;
  const defaultOriginDisplay = selectedCityName ?? DEFAULT_ORIGIN_LABEL;
  const originDisplay = originName || defaultOriginDisplay;
  const deviceLocatedOrigin = locatedOrigin?.source === 'device' ? locatedOrigin : null;
  const currentLocationLabel =
    deviceLocatedOrigin
      ? `已定位到 ${deviceLocatedOrigin.name}`
      : preferences.originSource === 'device' && originName
        ? '已保存设备坐标'
        : LOCATION_PENDING_LABEL;
  const originMapCityName =
    cities.find((city) => city.id === (findCityIdForOriginName(originDraft || originName, cities) ?? selectedCityId))
      ?.name ?? null;

  useEffect(() => {
    if (didApplyPcBlindboxRef.current || pcParams.source !== 'pc-blindbox') return;

    const partySize = parseFiniteParam(pcParams.partySize);
    const budgetMax = parseNullableNumberParam(pcParams.budgetMax);
    const randomLevelParam = parseFiniteParam(pcParams.randomLevel);
    const radiusKm = parseNullableNumberParam(pcParams.radiusKm);
    const originLatitude = parseFiniteParam(pcParams.originLatitude);
    const originLongitude = parseFiniteParam(pcParams.originLongitude);
    const originAccuracyMeters = parseNullableNumberParam(pcParams.originAccuracyMeters);
    const originSource = pcParams.originSource === 'device' ? 'device' : null;
    const destinationScope =
      pcParams.destinationScope === 'province' || pcParams.destinationScope === 'nationwide'
        ? pcParams.destinationScope
        : 'nearby';

    didApplyPcBlindboxRef.current = true;
    setPreferences((value) => ({
      ...value,
      partySize: partySize === null ? value.partySize : Math.max(1, Math.round(partySize)),
      budgetMax: pcParams.budgetMax ? budgetMax : value.budgetMax,
      mood: pcParams.mood?.trim() || value.mood,
      randomLevel:
        randomLevelParam === null ? value.randomLevel : clampPercent(Math.round(randomLevelParam)),
      radiusKm: pcParams.radiusKm ? radiusKm : value.radiusKm,
      originName: pcParams.originName?.trim() || value.originName,
      originLatitude,
      originLongitude,
      originAccuracyMeters,
      originSource,
      destinationScope,
    }));
  }, [
    pcParams.budgetMax,
    pcParams.destinationScope,
    pcParams.mood,
    pcParams.originAccuracyMeters,
    pcParams.originLatitude,
    pcParams.originLongitude,
    pcParams.originName,
    pcParams.originSource,
    pcParams.partySize,
    pcParams.radiusKm,
    pcParams.randomLevel,
    pcParams.source,
  ]);

  useEffect(() => {
    if (pcParams.source !== 'pc-blindbox' || !pcParams.originName || cities.length === 0) return;

    const matchedCityId = findCityIdForOriginName(pcParams.originName, cities);
    if (matchedCityId !== null && matchedCityId !== selectedCityId) {
      setSelectedCityId(matchedCityId);
    }
  }, [cities, pcParams.originName, pcParams.source, selectedCityId, setSelectedCityId]);

  const syncSelectedCityFromOrigin = useCallback(
    (nextOriginName: string) => {
      const matchedCityId = findCityIdForOriginName(nextOriginName, cities);
      if (matchedCityId !== null && matchedCityId !== selectedCityId) {
        setSelectedCityId(matchedCityId);
      }
    },
    [cities, selectedCityId, setSelectedCityId],
  );

  function handleOriginOpen() {
    originResolveRequestRef.current += 1;
    const savedLatitude = preferences.originLatitude;
    const savedLongitude = preferences.originLongitude;
    const hasSavedCoordinates = typeof savedLatitude === 'number' && typeof savedLongitude === 'number';

    setOriginDraft(originName || selectedCityName || '');
    setLocatedOrigin(
      originName && hasSavedCoordinates
        ? {
            name: originName,
            latitude: savedLatitude,
            longitude: savedLongitude,
            accuracyMeters: preferences.originAccuracyMeters ?? null,
            source: preferences.originSource ?? 'manual',
          }
        : null,
    );
    setOriginError(null);
    setIsResolvingOrigin(false);
    setIsOriginSheetVisible(true);
  }

  function handleOriginClose() {
    originResolveRequestRef.current += 1;
    setIsResolvingOrigin(false);
    setIsOriginSheetVisible(false);
  }

  async function handleUseCurrentLocation() {
    const requestId = originResolveRequestRef.current + 1;
    originResolveRequestRef.current = requestId;
    setOriginError(null);
    setIsLocating(true);

    try {
      const coords = await requestDeviceCurrentPosition({ accuracy: 'balanced' });
      if (requestId !== originResolveRequestRef.current) return;

      const { latitude, longitude, accuracy } = coords;
      const currentOrigin: OriginLocationCandidate = {
        name: DEVICE_ORIGIN_LABEL,
        latitude,
        longitude,
        accuracyMeters: accuracy ?? null,
        source: 'device',
      };
      setLocatedOrigin(currentOrigin);
      setOriginDraft(DEVICE_ORIGIN_LABEL);

      try {
        const resolvedAddress = await resolveCoordinatesAddress({ latitude, longitude });
        if (requestId !== originResolveRequestRef.current) return;

        const resolvedOrigin = {
          ...currentOrigin,
          name: resolvedAddress.trim() || DEVICE_ORIGIN_LABEL,
        };
        setLocatedOrigin(resolvedOrigin);
        setOriginDraft(resolvedOrigin.name);
        syncSelectedCityFromOrigin(resolvedOrigin.name);
      } catch (reason) {
        console.warn('当前位置地址解析失败', reason);
        if (requestId === originResolveRequestRef.current) {
          setOriginError('已获取当前位置，但地址解析失败，可手动补充具体位置。');
        }
      }
    } catch (reason) {
      if (requestId !== originResolveRequestRef.current) return;
      console.error('定位失败', reason);
      setLocatedOrigin(null);
      setOriginError(reason instanceof Error ? reason.message : '无法获取当前位置，请重试或手动输入出发地。');
    } finally {
      if (requestId === originResolveRequestRef.current) {
        setIsLocating(false);
      }
    }
  }

  const resolveDraftOrigin = useCallback(
    async (address = originDraft.trim(), { syncDraft = true }: { syncDraft?: boolean } = {}) => {
      const nextOriginName = address.trim();
      if (!nextOriginName) {
        setOriginError('请输入出发地后再保存。');
        return null;
      }

      const requestId = originResolveRequestRef.current + 1;
      originResolveRequestRef.current = requestId;
      setOriginError(null);
      setIsResolvingOrigin(true);

      try {
        const resolved = await resolveAddressLocation(nextOriginName);
        if (requestId !== originResolveRequestRef.current) return null;

        const nextLocatedOrigin: OriginLocationCandidate = {
          name: syncDraft ? resolved.name || nextOriginName : nextOriginName,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          accuracyMeters: null,
          source: 'manual',
        };
        setLocatedOrigin(nextLocatedOrigin);
        if (syncDraft) {
          setOriginDraft(nextLocatedOrigin.name);
        }
        syncSelectedCityFromOrigin(resolved.name || nextOriginName);
        return nextLocatedOrigin;
      } catch (reason) {
        if (requestId !== originResolveRequestRef.current) return null;

        console.error('手动地址定位失败', reason);
        setLocatedOrigin(null);
        setOriginError(reason instanceof Error ? reason.message : '无法定位这个地址，请补充城市或街道信息。');
        return null;
      } finally {
        if (requestId === originResolveRequestRef.current) {
          setIsResolvingOrigin(false);
        }
      }
    },
    [originDraft, syncSelectedCityFromOrigin],
  );

  useEffect(() => {
    if (!isOriginSheetVisible || isLocating) return;

    const nextOriginName = originDraft.trim();
    if (!nextOriginName || locatedOrigin?.name === nextOriginName) return;

    const timeout = setTimeout(() => {
      void resolveDraftOrigin(nextOriginName, { syncDraft: false });
    }, 650);

    return () => clearTimeout(timeout);
  }, [isLocating, isOriginSheetVisible, locatedOrigin?.name, originDraft, resolveDraftOrigin]);

  function handleOriginDraftChange(value: string) {
    originResolveRequestRef.current += 1;
    setOriginDraft(value);
    setLocatedOrigin(null);
    if (value.trim()) {
      setOriginError(null);
    } else {
      setIsResolvingOrigin(false);
    }
  }

  async function handleSaveOrigin() {
    let nextLocatedOrigin = locatedOrigin;
    const nextOriginName = originDraft.trim();

    if (nextOriginName && (!nextLocatedOrigin || nextLocatedOrigin.name !== nextOriginName)) {
      nextLocatedOrigin = await resolveDraftOrigin(nextOriginName, { syncDraft: true });
      if (!nextLocatedOrigin) return;
    }

    const savedOriginName = nextLocatedOrigin?.name.trim() || nextOriginName;
    if (!savedOriginName || !nextLocatedOrigin) return;

    syncSelectedCityFromOrigin(savedOriginName);

    setPreferences((value) => ({
      ...value,
      originName: savedOriginName,
      originLatitude: nextLocatedOrigin.latitude,
      originLongitude: nextLocatedOrigin.longitude,
      originAccuracyMeters: nextLocatedOrigin.accuracyMeters,
      originSource: nextLocatedOrigin.source,
    }));
    setLocatedOrigin(null);
    setIsOriginSheetVisible(false);
  }

  function handleClearOrigin() {
    originResolveRequestRef.current += 1;
    setPreferences((value) => ({
      ...value,
      originName: null,
      originLatitude: null,
      originLongitude: null,
      originAccuracyMeters: null,
      originSource: null,
    }));
    setOriginDraft('');
    setLocatedOrigin(null);
    setOriginError(null);
    setIsResolvingOrigin(false);
    setIsOriginSheetVisible(false);
  }

  function handleRevealPress() {
    const drawCityId = findCityIdForOriginName(originName, cities) ?? selectedCityId;
    if (!drawCityId || isDrawing || isRevealVideoVisible) return;

    if (drawCityId !== selectedCityId) {
      setSelectedCityId(drawCityId);
    }

    clearError();
    revealRequestStatusRef.current = 'pending';
    setRevealRequestStatus('pending');
    setRevealPlaybackKey((value) => value + 1);
    setIsRevealVideoVisible(true);
    setIsDrawing(true);

    void startDraw(drawCityId, preferences)
      .then(() => {
        revealRequestStatusRef.current = 'success';
        setRevealRequestStatus('success');
      })
      .catch(() => {
        // AppContext 已写入 error，动画当前轮结束后回到本页展示。
        revealRequestStatusRef.current = 'error';
        setRevealRequestStatus('error');
      });
  }

  const finishRevealTransition = useCallback(
    (status: RevealRequestStatus) => {
      revealRequestStatusRef.current = 'idle';
      setRevealRequestStatus('idle');
      setIsRevealVideoVisible(false);
      setIsDrawing(false);

      if (status === 'success') {
        router.push('/draw');
      }
    },
    [router],
  );

  const handleRevealPlaybackCycleEnd = useCallback(() => {
    const status = revealRequestStatusRef.current;

    if (status === 'pending') {
      setRevealPlaybackKey((value) => value + 1);
      return;
    }

    finishRevealTransition(status);
  }, [finishRevealTransition]);

  if (!options) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  return (
    <AppShell>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.page, { paddingBottom: bottom + spacing.lg }]}
          showsVerticalScrollIndicator={false}>
          <DesignBackHeader title="设置偏好" onBack={() => backOrReplace(router)} />

          <View style={styles.titleRow}>
            <View style={styles.titleMain}>
              <Text style={styles.screenTitle}>让 AI 知道你今天的状态</Text>
              <Text style={styles.screenDesc}>选择越轻，我们的约定越容易真的完成。</Text>
            </View>
          </View>

          {error ? <ErrorCard message={error} /> : null}

          <Pressable
            accessibilityHint="打开后可以使用当前位置或手动输入"
            accessibilityLabel={`出发地，${originDisplay}`}
            accessibilityRole="button"
            onPress={handleOriginOpen}
            style={({ pressed }) => [styles.inputCard, pressed && styles.pressed]}>
            <AppIcon name="location" size={14} color={palette.error} style={styles.inputIcon} />
            <View style={styles.inputText}>
              <Text style={styles.cardLabel}>出发地</Text>
              <Text
                numberOfLines={1}
                style={[styles.inputValue, originName || selectedCityName ? styles.inputValueActive : null]}>
                {originDisplay}
              </Text>
            </View>
            <AppIcon name="arrow-right" size={17} color={palette.placeholder} />
          </Pressable>

          <OptionGroup
            label="可用时间"
            options={options.durations}
            value={preferences.durationMinutes}
            onChange={(durationMinutes) =>
              setPreferences((value) => ({ ...value, durationMinutes }))
            }
          />
          <OptionGroup
            label="人均预算"
            options={BUDGET_OPTIONS}
            value={preferences.budgetMax}
            onChange={(budgetMax) => setPreferences((value) => ({ ...value, budgetMax }))}
          />
          <OptionGroup
            label="心情"
            options={MOOD_OPTIONS}
            value={preferences.mood}
            onChange={(mood) => setPreferences((value) => ({ ...value, mood }))}
          />

          <View style={[styles.cardButtonStack, { gap: cardButtonGap }]}>
            <View style={[styles.readyCard, isCompactHeight && styles.readyCardCompact]}>
              <View style={[styles.ipSlot, isCompactHeight && styles.ipSlotCompact]}>
                <Image source={MASCOT_MOON} resizeMode="contain" style={styles.mascotImage} />
              </View>
              <View style={styles.readyText}>
                <Text style={styles.readyTitle}>准备揭晓</Text>
              <Text style={styles.readyCopy}>点击后只生成一个现在能执行的出门方案。</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isDrawing || isRevealVideoVisible || !selectedCityId}
              onPress={handleRevealPress}
              style={({ pressed }) => [
                styles.primaryButton,
                (isDrawing || isRevealVideoVisible || !selectedCityId) && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryText}>
                {isRevealVideoVisible ? '正在打开盲盒…' : isDrawing ? '正在揭晓…' : '揭开谜底 ✨'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <OriginPickerSheet
          currentLocationLabel={currentLocationLabel}
          draft={originDraft}
          error={originError}
          isLocating={isLocating}
          isResolvingOrigin={isResolvingOrigin}
          locatedOrigin={locatedOrigin}
          mapCityName={originMapCityName}
          onChangeDraft={handleOriginDraftChange}
          onClear={handleClearOrigin}
          onClose={handleOriginClose}
          onSave={handleSaveOrigin}
          onUseCurrent={handleUseCurrentLocation}
          selectedOriginName={originName}
          selectedOriginSource={preferences.originSource ?? null}
          visible={isOriginSheetVisible}
        />

        {isRevealVideoVisible ? (
          <RevealVideoOverlay
            key={revealPlaybackKey}
            onCycleComplete={handleRevealPlaybackCycleEnd}
            requestStatus={revealRequestStatus}
          />
        ) : null}
    </AppShell>
  );
}

function OptionGroup<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={`${option.label}-${String(option.value)}`}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceOn,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function OriginPickerSheet({
  currentLocationLabel,
  draft,
  error,
  isLocating,
  isResolvingOrigin,
  locatedOrigin,
  mapCityName,
  onChangeDraft,
  onClear,
  onClose,
  onSave,
  onUseCurrent,
  selectedOriginName,
  selectedOriginSource,
  visible,
}: {
  currentLocationLabel: string;
  draft: string;
  error: string | null;
  isLocating: boolean;
  isResolvingOrigin: boolean;
  locatedOrigin: OriginLocationCandidate | null;
  mapCityName: string | null;
  onChangeDraft: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  onUseCurrent: () => void | Promise<void>;
  selectedOriginName: string;
  selectedOriginSource: Preferences['originSource'] | null;
  visible: boolean;
}) {
  const [originInputHeight, setOriginInputHeight] = useState(ORIGIN_INPUT_MIN_HEIGHT);
  const hasDraft = draft.trim().length > 0;
  const isBusy = isLocating || isResolvingOrigin;
  const isCurrentSelected =
    locatedOrigin?.source === 'device' ||
    (selectedOriginSource === 'device' && selectedOriginName.length > 0 && draft.trim() === selectedOriginName);
  const canSave = (hasDraft || Boolean(locatedOrigin)) && !isBusy;
  const originMapPoints = locatedOrigin
    ? [
        {
          id: 'origin-picker',
          name: '出发地',
          longitude: locatedOrigin.longitude,
          latitude: locatedOrigin.latitude,
          color: palette.primary,
        },
      ]
    : [];
  const originMapCenter = locatedOrigin
    ? ([locatedOrigin.longitude, locatedOrigin.latitude] as const)
    : undefined;
  const originMapAddress = draft.trim() || selectedOriginName || null;
  const displayedOriginInputHeight = hasDraft ? originInputHeight : ORIGIN_INPUT_MIN_HEIGHT;

  return (
    <BottomSheet title="设置出发地" visible={visible} onClose={onClose}>
      <View style={styles.originSheet}>
        <Pressable
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityState={{ selected: isCurrentSelected }}
          onPress={() => void onUseCurrent()}
          style={({ pressed }) => [
            styles.currentLocationButton,
            isCurrentSelected && styles.currentLocationButtonActive,
            isBusy && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <View style={styles.currentLocationIcon}>
            {isLocating ? (
              <ActivityIndicator color={palette.primary} size="small" />
            ) : (
              <AppIcon name="locate" size={18} color={palette.primary} />
            )}
          </View>
          <View style={styles.currentLocationText}>
            <Text style={styles.currentLocationTitle}>{isLocating ? '定位中…' : '使用当前位置'}</Text>
            <Text style={styles.currentLocationDesc} numberOfLines={1}>
              {currentLocationLabel}
            </Text>
          </View>
          {isCurrentSelected ? <AppIcon name="check" size={18} color={palette.primary} /> : null}
        </Pressable>

        {error ? <Text style={styles.originErrorText}>{error}</Text> : null}

        <View style={styles.originMapCard}>
          <AmapView
            address={locatedOrigin ? null : originMapAddress}
            center={originMapCenter}
            city={mapCityName}
            fallbackVariant="preview"
            markerVariant="default"
            points={originMapPoints}
            selectedId={null}
            selectedZoom={16}
            showStatusBadge={false}
            zoom={14}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.manualOriginBlock}>
          <Text style={styles.originInputLabel}>地图定位</Text>
          <View style={styles.originInputWrap}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              onChangeText={onChangeDraft}
              onContentSizeChange={(event) => {
                if (!hasDraft) return;

                const contentHeight = Math.ceil(event.nativeEvent.contentSize.height);
                const nextHeight = Math.min(
                  ORIGIN_INPUT_MAX_HEIGHT,
                  Math.max(ORIGIN_INPUT_MIN_HEIGHT, contentHeight + ORIGIN_INPUT_VERTICAL_PADDING),
                );
                setOriginInputHeight(nextHeight);
              }}
              onSubmitEditing={() => void onSave()}
              placeholder="例如：南京西路地铁站 / 公司楼下"
              placeholderTextColor={palette.placeholder}
              returnKeyType="done"
              scrollEnabled={displayedOriginInputHeight >= ORIGIN_INPUT_MAX_HEIGHT}
              style={[styles.originInput, { height: displayedOriginInputHeight }]}
              textAlignVertical="top"
              value={draft}
            />
            {isResolvingOrigin ? (
              <View style={styles.originInputSpinner}>
                <ActivityIndicator color={palette.primary} size="small" />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.originActions}>
          <Pressable
            accessibilityRole="button"
            disabled={!selectedOriginName && !locatedOrigin && !draft.trim()}
            onPress={onClear}
            style={({ pressed }) => [
              styles.originSecondaryButton,
              !selectedOriginName && !locatedOrigin && !draft.trim() && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.originSecondaryText}>清除</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={() => void onSave()}
            style={({ pressed }) => [
              styles.originPrimaryButton,
              !canSave && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.originPrimaryText}>保存</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

function RevealVideoOverlay({
  onCycleComplete,
  requestStatus,
}: {
  onCycleComplete: () => void;
  requestStatus: RevealRequestStatus;
}) {
  const videoUri = Asset.fromModule(REVEAL_VIDEO).uri;
  const { height, width } = useWindowDimensions();
  const revealVideoWidth = Math.min(
    REVEAL_VIDEO_MAX_WIDTH,
    Math.max(240, width - spacing.lg * 2),
    Math.max(240, (height - REVEAL_OVERLAY_VERTICAL_RESERVE) * REVEAL_VIDEO_ASPECT_RATIO),
  );

  useEffect(() => {
    const timeout = setTimeout(onCycleComplete, Platform.OS === 'web' && videoUri ? REVEAL_VIDEO_TIMEOUT_MS : 900);
    return () => clearTimeout(timeout);
  }, [onCycleComplete, videoUri]);

  return (
    <View style={styles.revealOverlay}>
      <View style={styles.revealGlowOne} />
      <View style={styles.revealGlowTwo} />
      <View style={[styles.revealVideoCard, { width: revealVideoWidth }]}>
        <View style={styles.revealVideoInner}>
          {Platform.OS === 'web' && videoUri ? (
            <>
              {createElement('video', {
                src: videoUri,
                autoPlay: true,
                muted: true,
                playsInline: true,
                controls: false,
                onCanPlay: (event: { currentTarget: HTMLVideoElement }) => {
                  event.currentTarget.play().catch(() => undefined);
                },
                onEnded: onCycleComplete,
                onError: () => undefined,
                style: {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                  borderRadius: 28,
                  backgroundColor: REVEAL_VIDEO_BG,
                },
              })}
            </>
          ) : (
            <View style={styles.revealFallback}>
              <ActivityIndicator color={palette.primary} size="large" />
            </View>
          )}
        </View>
      </View>
      <Text style={styles.revealOverlayTitle}>正在打开你的盲盒</Text>
      <Text style={styles.revealOverlayText}>
        {requestStatus === 'pending' ? '正在生成方案小卡，完成前会继续播放' : '方案已生成，马上打开结果'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas },
  screen: { flex: 1, backgroundColor: palette.canvas },
  page: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardButtonStack: {
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  titleMain: { flex: 1, minWidth: 0 },
  screenTitle: {
    color: palette.ink,
    fontFamily: Platform.select({
      web: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      ios: 'PingFang SC',
      android: 'sans-serif',
      default: undefined,
    }),
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  screenDesc: {
    marginTop: spacing.sm,
    color: palette.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '700',
  },
  inputCard: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 26,
    paddingRight: 18,
    paddingVertical: 9,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never, outlineWidth: 0 as never } : {}),
    ...shadows.card,
  },
  inputIcon: { marginTop: -16 },
  inputText: { flex: 1, minWidth: 0 },
  cardLabel: { color: palette.ink, fontSize: typography.body, lineHeight: 18, fontWeight: '900' },
  inputValue: { marginTop: 2, color: palette.text, fontSize: typography.body, lineHeight: 18, fontWeight: '800' },
  inputValueActive: { color: palette.primaryDark },
  originSheet: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  currentLocationButton: {
    minHeight: 66,
    borderRadius: radii.lg,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currentLocationButtonActive: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primaryLight,
  },
  currentLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationText: { flex: 1, minWidth: 0 },
  currentLocationTitle: {
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 19,
    fontWeight: '900',
  },
  currentLocationDesc: {
    marginTop: 3,
    color: palette.muted,
    fontSize: typography.caption,
    lineHeight: 17,
    fontWeight: '700',
  },
  originErrorText: {
    color: palette.error,
    fontSize: typography.caption,
    lineHeight: 17,
    fontWeight: '800',
  },
  originMapCard: {
    height: 156,
    borderRadius: radii.lg,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    position: 'relative',
  },
  manualOriginBlock: {
    gap: spacing.sm,
  },
  originInputLabel: {
    color: palette.ink,
    fontSize: typography.caption,
    lineHeight: 17,
    fontWeight: '900',
  },
  originInput: {
    borderRadius: radii.lg,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: ORIGIN_INPUT_VERTICAL_PADDING / 2,
    paddingRight: 42,
  },
  originInputWrap: {
    position: 'relative',
  },
  originInputSpinner: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  originActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  originSecondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originSecondaryText: { color: palette.text, fontSize: typography.body, fontWeight: '900' },
  originPrimaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryButton,
  },
  originPrimaryText: { color: palette.white, fontSize: typography.body, fontWeight: '900' },
  optionGroup: { gap: spacing.sm },
  optionLabel: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    ...shadows.card,
  },
  choiceOn: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  choiceText: { color: palette.text, fontSize: typography.caption, fontWeight: '900' },
  choiceTextOn: { color: palette.white },
  randomBlock: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  randomHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  randomValue: { color: palette.primary, fontSize: typography.caption, fontWeight: '900' },
  meterTouchArea: {
    height: 28,
    justifyContent: 'center',
  },
  meterTrack: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: palette.contour,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: palette.primary,
  },
  meterThumb: {
    position: 'absolute',
    top: 4,
    width: RANDOM_THUMB_SIZE,
    height: RANDOM_THUMB_SIZE,
    borderRadius: RANDOM_THUMB_SIZE / 2,
    backgroundColor: palette.white,
    borderWidth: 3,
    borderColor: palette.primary,
    ...shadows.card,
  },
  meterThumbNoPointer: {
    pointerEvents: 'none',
  },
  readyCard: {
    minHeight: 150,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 18,
    ...shadows.elevated,
  },
  readyCardCompact: {
    minHeight: 116,
    paddingVertical: 10,
  },
  ipSlot: {
    width: 142,
    height: 116,
    justifyContent: 'center',
    overflow: 'visible',
  },
  ipSlotCompact: {
    width: 124,
    height: 96,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  readyText: { flex: 1, minWidth: 0 },
  readyTitle: { color: palette.ink, fontSize: typography.h3, fontWeight: '900' },
  readyCopy: { marginTop: spacing.xs, color: palette.muted, fontSize: typography.caption, lineHeight: 18, fontWeight: '800' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    ...shadows.primaryButton,
  },
  primaryText: { color: palette.white, fontSize: typography.body, fontWeight: '900' },
  revealOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    backgroundColor: 'rgba(243,240,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  revealGlowOne: {
    position: 'absolute',
    top: 72,
    right: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(126,166,31,0.16)',
  },
  revealGlowTwo: {
    position: 'absolute',
    left: -70,
    bottom: 110,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(127,219,255,0.22)',
  },
  revealVideoCard: {
    aspectRatio: REVEAL_VIDEO_ASPECT_RATIO,
    borderRadius: 32,
    padding: 0,
    marginTop: 0,
    backgroundColor: REVEAL_VIDEO_BG,
    borderWidth: 1,
    borderColor: REVEAL_VIDEO_BG,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  revealVideoInner: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: REVEAL_VIDEO_BG,
    position: 'relative',
  },
  revealFallback: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REVEAL_VIDEO_BG,
  },
  revealOverlayTitle: {
    marginTop: spacing.lg,
    color: palette.ink,
    fontSize: typography.h3,
    lineHeight: 22,
    fontWeight: '900',
  },
  revealOverlayText: {
    marginTop: spacing.xs,
    color: palette.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '800',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78 },
});
