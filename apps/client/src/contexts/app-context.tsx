import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

import {
  addTodo,
  createGuestSession,
  createOrContinueDraw,
  getCities,
  getPreferenceOptions,
  rerollDraw,
  resolveApiMediaUrl,
} from '@/services/api';
import type { City, DrawResult, GuestUser, PreferenceOptions, Preferences } from '@/types';

const DEVICE_KEY = '@lazyde/device-id';
const CURRENT_DRAW_KEY_PREFIX = '@lazyde/current-draw:';
const CURRENT_DRAW_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

type LastDrawInput = {
  cityId: number;
  preferences: Preferences;
};

type StoredDrawState = {
  userId: number;
  savedAt: number;
  result: DrawResult;
  input: LastDrawInput;
};

type AppContextValue = {
  user: GuestUser | null;
  isRegistered: boolean;
  cities: City[];
  options: PreferenceOptions | null;
  selectedCityId: number | null;
  currentDraw: DrawResult | null;
  isBooting: boolean;
  error: string | null;
  setSelectedCityId: (cityId: number) => void;
  startDraw: (cityId: number, preferences: Preferences) => Promise<void>;
  reroll: () => Promise<DrawResult>;
  addCurrentDrawToTodos: (scheduledDate?: string) => Promise<{ id: number; alreadyExists: boolean }>;
  clearError: () => void;
  retry: () => Promise<void>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function createDeviceId() {
  return `lazyde-${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const created = createDeviceId();
  await AsyncStorage.setItem(DEVICE_KEY, created);
  return created;
}

function getCurrentDrawKey(userId: number) {
  return `${CURRENT_DRAW_KEY_PREFIX}${userId}`;
}

function normalizeCurrentDrawCover(result: DrawResult): DrawResult {
  return {
    ...result,
    activity: {
      ...result.activity,
      coverImageUri: resolveApiMediaUrl(result.activity.coverImageUri),
    },
  };
}

function isDrawResult(value: unknown): value is DrawResult {
  if (typeof value !== 'object' || value === null) return false;

  const input = value as DrawResult & {
    attemptsUsed?: unknown;
    attemptsRemaining?: unknown;
    activity?: unknown;
  };
  return (
    typeof input.drawSessionId === 'string' &&
    uuidPattern.test(input.drawSessionId) &&
    typeof input.attemptsUsed === 'number' &&
    Number.isFinite(input.attemptsUsed) &&
    typeof input.attemptsRemaining === 'number' &&
    Number.isFinite(input.attemptsRemaining) &&
    typeof input.activity === 'object' &&
    input.activity !== null
  );
}

async function readStoredCurrentDraw(userId: number) {
  const raw = await AsyncStorage.getItem(getCurrentDrawKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredDrawState;
    const expired = Date.now() - Number(parsed.savedAt) > CURRENT_DRAW_TTL_MS;
    if (!parsed || parsed.userId !== userId || expired || !isDrawResult(parsed.result)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeStoredCurrentDraw(userId: number, result: DrawResult, input: LastDrawInput) {
  const payload: StoredDrawState = { userId, savedAt: Date.now(), result, input };
  await AsyncStorage.setItem(getCurrentDrawKey(userId), JSON.stringify(payload));
}

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [options, setOptions] = useState<PreferenceOptions | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [currentDraw, setCurrentDraw] = useState<DrawResult | null>(null);
  const [lastDrawInput, setLastDrawInput] = useState<LastDrawInput | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    setIsBooting(true);
    setError(null);

    try {
      const deviceId = await getOrCreateDeviceId();
      const [cityData, optionData, guestUser] = await Promise.all([
        getCities(),
        getPreferenceOptions(),
        createGuestSession(deviceId),
      ]);

      setCities(cityData);
      setOptions(optionData);
      setUser(guestUser);
      setSelectedCityId((current) => current ?? cityData[0]?.id ?? null);

      const snapshot = await readStoredCurrentDraw(guestUser.id);
      if (snapshot) {
        setCurrentDraw(normalizeCurrentDrawCover(snapshot.result));
        setLastDrawInput(snapshot.input);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '应用初始化失败');
    } finally {
      setIsBooting(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void bootstrap());
  }, [bootstrap]);

  const ensureGuestUser = useCallback(async () => {
    if (user) return user;
    const deviceId = await getOrCreateDeviceId();
    const guestUser = await createGuestSession(deviceId);
    setUser(guestUser);
    return guestUser;
  }, [user]);

  const startDraw = useCallback(
    async (cityId: number, preferences: Preferences) => {
      const guestUser = await ensureGuestUser();
      setError(null);

      try {
        const result = normalizeCurrentDrawCover(
          await createOrContinueDraw({ userId: guestUser.id, cityId, preferences }),
        );
        const input = { cityId: result.activity.cityId, preferences };
        setCurrentDraw(result);
        setLastDrawInput(input);
        await writeStoredCurrentDraw(guestUser.id, result, input);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '方案生成失败');
        throw reason;
      }
    },
    [ensureGuestUser],
  );

  const reroll = useCallback(async () => {
    if (!user || !currentDraw || !lastDrawInput) throw new Error('没有可以继续的方案');
    setError(null);

    try {
      const result = normalizeCurrentDrawCover(
        await rerollDraw({
          userId: user.id,
          cityId: lastDrawInput.cityId,
          preferences: lastDrawInput.preferences,
          drawSessionId: currentDraw.drawSessionId,
        }),
      );
      setCurrentDraw(result);
      await writeStoredCurrentDraw(user.id, result, lastDrawInput);
      return result;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '重新推荐失败');
      throw reason;
    }
  }, [currentDraw, lastDrawInput, user]);

  const addCurrentDrawToTodos = useCallback(
    async (scheduledDate?: string) => {
      if (!user || !currentDraw) throw new Error('还没有确认的出门方案');
      return await addTodo({
        userId: user.id,
        activityId: currentDraw.activity.id,
        drawSessionId: currentDraw.drawSessionId,
        ...(scheduledDate ? { scheduledDate } : {}),
      });
    },
    [currentDraw, user],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      isRegistered: false,
      cities,
      options,
      selectedCityId,
      currentDraw,
      isBooting,
      error,
      setSelectedCityId,
      startDraw,
      reroll,
      addCurrentDrawToTodos,
      clearError: () => setError(null),
      retry: bootstrap,
      logout: async () => undefined,
    }),
    [
      addCurrentDrawToTodos,
      bootstrap,
      cities,
      currentDraw,
      error,
      isBooting,
      options,
      reroll,
      selectedCityId,
      startDraw,
      user,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
