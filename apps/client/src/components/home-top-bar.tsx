import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { BottomSheet } from '@/components/bottom-sheet';
import { useApp } from '@/contexts/app-context';
import { requestDeviceCurrentPosition } from '@/lib/device-location';
import { resolveCoordinatesAddress } from '@/lib/reverse-geocode';
import { components, palette } from '@/theme';
import type { City } from '@/types';

const BRAND_LOGO = require('../../assets/images/home-brand-logo.png');
const DEFAULT_CITY_LABEL = '选择城市';

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

function findCityIdFromAddress(address: string, cities: readonly City[]) {
  const normalizedAddress = normalizeCityText(address);
  const matchedCity = cities.find((city) =>
    cityMatchTokens(city).some((token) => normalizedAddress.includes(token)),
  );
  return matchedCity?.id ?? null;
}

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** 首页顶栏：参考智能设备 App 的胶囊品牌标识与轻量操作区。 */
export function HomeTopBar() {
  const { cities, selectedCityId, setSelectedCityId } = useApp();
  const [isCitySheetVisible, setIsCitySheetVisible] = useState(false);
  const [isLocatingCity, setIsLocatingCity] = useState(false);

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) ?? cities[0],
    [cities, selectedCityId],
  );
  const selectedCityName = selectedCity?.name ?? DEFAULT_CITY_LABEL;
  const canSelectCity = cities.length > 0;

  function openCityPicker() {
    if (!canSelectCity) return;
    setIsCitySheetVisible(true);
  }

  function closeCityPicker() {
    setIsCitySheetVisible(false);
  }

  function chooseCity(cityId: number) {
    setSelectedCityId(cityId);
    closeCityPicker();
  }

  async function handleLocateCity() {
    if (isLocatingCity || !canSelectCity) return;

    setIsLocatingCity(true);
    try {
      const coords = await requestDeviceCurrentPosition({ accuracy: 'balanced' });
      const address = await resolveCoordinatesAddress({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const cityId = findCityIdFromAddress(address, cities);

      if (cityId === null) {
        showMessage('未找到支持的城市', `当前定位城市：${address}，请手动选择。`);
        return;
      }

      setSelectedCityId(cityId);
      closeCityPicker();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '定位失败，请稍后重试。';
      showMessage('定位失败', message);
    } finally {
      setIsLocatingCity(false);
    }
  }

  return (
    <View style={styles.nav} accessibilityLabel="首页顶部栏">
      <View style={styles.logoWrap}>
        <Image
          accessibilityLabel="懒得动"
          resizeMode="contain"
          source={BRAND_LOGO}
          style={styles.logoImage}
        />
      </View>

      <Pressable
        accessibilityLabel={`当前城市：${selectedCityName}`}
        accessibilityRole="button"
        disabled={!canSelectCity}
        onPress={openCityPicker}
        style={({ pressed }) => [
          styles.cityPicker,
          pressed && canSelectCity && styles.cityPickerPressed,
          !canSelectCity && styles.cityPickerDisabled,
        ]}>
        <AppIcon name="location" size={14} color={palette.muted} />
        <View style={styles.cityTextWrap}>
          <Text style={styles.cityLabel} numberOfLines={1} ellipsizeMode="tail">
            {selectedCityName}
          </Text>
          {!canSelectCity ? <Text style={styles.citySubLabel}>点击重试</Text> : null}
        </View>
      </Pressable>

      <BottomSheet title="选择城市" visible={isCitySheetVisible} onClose={closeCityPicker}>
        <Pressable
          accessibilityLabel="定位到当前位置城市"
          accessibilityRole="button"
          disabled={!canSelectCity}
          onPress={() => void handleLocateCity()}
          style={({ pressed }) => [
            styles.locateCityAction,
            pressed && canSelectCity && styles.locateCityActionPressed,
            !canSelectCity && styles.locateCityActionDisabled,
          ]}>
          {isLocatingCity ? (
            <ActivityIndicator color={palette.primary} size="small" />
          ) : (
            <>
              <AppIcon name="locate" size={15} color={palette.ink} />
              <Text style={styles.locateCityActionText}>定位当前位置</Text>
            </>
          )}
        </Pressable>

        <View style={styles.citySectionDivider} />

        <ScrollView contentContainerStyle={styles.citySheetList}>
          {cities.map((city) => {
            const isActive = city.id === selectedCity?.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={city.id}
                onPress={() => void chooseCity(city.id)}
                style={({ pressed }) => [
                  styles.cityOption,
                  pressed && styles.cityOptionPressed,
                  isActive && styles.cityOptionActive,
                ]}>
                <View style={styles.cityOptionTextWrap}>
                  <Text style={[styles.cityOptionName, isActive && styles.cityOptionNameActive]}>
                    {city.name}
                  </Text>
                  <Text style={[styles.cityOptionProvince, isActive && styles.cityOptionProvinceActive]}>
                    {city.province}
                  </Text>
                </View>
                {isActive ? <AppIcon name="check" size={16} color={palette.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: components.topBarHeight + 24,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: palette.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  logoImage: {
    width: 76,
    height: 50,
  },
  cityPicker: {
    alignItems: 'center',
    backgroundColor: palette.paper,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    flexDirection: 'row',
    gap: 6,
    maxWidth: 132,
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cityPickerPressed: {
    opacity: 0.78,
  },
  cityPickerDisabled: {
    opacity: 0.46,
  },
  cityTextWrap: {
    minWidth: 0,
    flex: 1,
  },
  cityLabel: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  citySubLabel: {
    marginTop: 1,
    color: palette.muted,
    fontSize: 10,
    lineHeight: 13,
  },
  locateCityAction: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.contour,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  locateCityActionPressed: {
    opacity: 0.78,
  },
  locateCityActionDisabled: {
    opacity: 0.46,
  },
  locateCityActionText: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  citySectionDivider: {
    height: 1,
    backgroundColor: palette.borderStrong,
    marginTop: 12,
    marginBottom: 4,
  },
  citySheetList: {
    gap: 8,
  },
  cityOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.contour,
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cityOptionPressed: {
    opacity: 0.76,
  },
  cityOptionActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  cityOptionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cityOptionName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  cityOptionNameActive: {
    color: palette.primaryDark,
  },
  cityOptionProvince: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  cityOptionProvinceActive: {
    color: palette.primary,
  },
});
