import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-storage';
import {
  createDemoDraw,
  createDemoGuest,
  demoActivities,
  demoCities,
  demoPreferenceOptions,
} from '@/services/demo-data';
import type {
  Activity,
  ApiResponse,
  AuthCodeTicket,
  AuthSession,
  WeekCheckinSummary,
  ProfileProgress,
  City,
  DrawRequest,
  DrawResult,
  DrawRestorePayload,
  GuestUser,
  LoginInput,
  PaymentOrder,
  CompletionAttachmentInput,
  CompletionSubmissionRequest,
  CompletionSubmissionResult,
  CompletionVisibility,
  DiaryCommentCreateRequest,
  DiaryCommentItem,
  DiaryCommentLikeRequest,
  DiaryCommentLikeResponse,
  DiaryCommentListResponse,
  DiaryLikeRequest,
  DiaryLikeResponse,
  DiaryFavoriteRequest,
  DiaryFavoriteResponse,
  DiaryHiddenRequest,
  DiaryHiddenResponse,
  DiaryReportRequest,
  DiaryReportResponse,
  CommunityFollowRequest,
  CommunityFollowResponse,
  CommunityOverviewResponse,
  PreferenceOptions,
  RegisterInput,
  VipPaymentCreateResponse,
  DiaryListResponse,
  HistoryListResponse,
  MyDiaryItem,
  HistoryItem,
  Todo,
  TodoStatus,
} from '@/types';

const platformDefault = Platform.select({
  android: 'http://10.0.2.2:3001/api/v1',
  default: 'http://localhost:3001/api/v1',
});

const API_URL = process.env.EXPO_PUBLIC_API_URL || platformDefault;
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');
const API_REQUEST_TIMEOUT_MS = 4_000;
const AUTH_CODE_REQUEST_TIMEOUT_MS = 20_000;
// 抽取链路可能包含向量召回、坐标补全和 AI 决策，冷启动时明显长于普通接口。
const DRAW_REQUEST_TIMEOUT_MS = 45_000;
const DEMO_TODOS_KEY = '@weekend-oracle/demo-todos';
let localDemoModeEnabled = false;
let demoCurrentDraw: DrawResult | null = null;

export function isLocalDemoMode() {
  return localDemoModeEnabled;
}

export function resolveApiMediaUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const runtimePagesBasePath = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
    ? `/${window.location.pathname.split('/').filter(Boolean)[0] ?? ''}`
    : '';
  const pagesBasePath = process.env.EXPO_GITHUB_PAGES_BASE_URL || runtimePagesBasePath;
  const isFrontendAsset = Platform.OS === 'web' && (
    trimmed.startsWith('/media/') ||
    trimmed.startsWith('/assets/') ||
    Boolean(pagesBasePath && trimmed.startsWith(`${pagesBasePath}/`))
  );

  if (
    isFrontendAsset ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('asset:') ||
    trimmed.startsWith('/_expo/') ||
    trimmed.startsWith('/assets/?unstable_path=')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  return `${API_ORIGIN}/${trimmed}`;
}

function normalizeDiaryItem(item: MyDiaryItem) {
  return {
    ...item,
    authorAvatarUri: resolveApiMediaUrl(item.authorAvatarUri),
    attachments: (item.attachments ?? []).flatMap((attachment) => {
      const uri = resolveApiMediaUrl(attachment.uri);
      return uri ? [{ ...attachment, uri }] : [];
    }),
  };
}

function normalizeDiaryComment(item: DiaryCommentItem): DiaryCommentItem {
  return {
    ...item,
    replyToCommentId: item.replyToCommentId ?? null,
    replyToAuthor: item.replyToAuthor ?? null,
    authorAvatarUri: resolveApiMediaUrl(item.authorAvatarUri),
    replies: item.replies.map(normalizeDiaryComment),
  };
}

function normalizeActivity(item: Activity): Activity {
  return {
    ...item,
    coverImageUri: resolveApiMediaUrl(item.coverImageUri),
  };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined) {
  return typeof value === 'string' && uuidPattern.test(value);
}

function normalizeDrawRequestForApi(input: DrawRequest): DrawRequest {
  if (!input.drawSessionId || isUuid(input.drawSessionId)) {
    return input;
  }

  const rest = { ...input };
  delete rest.drawSessionId;
  return rest;
}

function normalizeDrawSessionIdForApi(value: string | null | undefined) {
  return isUuid(value) ? value : null;
}

class ApiConnectionError extends Error {
  constructor(message = '无法连接服务器，请稍后重试') {
    super(message);
  }
}

async function withDemoFallback<T>(
  request: () => Promise<T>,
  fallback: () => T | Promise<T>,
) {
  if (localDemoModeEnabled) return await fallback();

  try {
    return await request();
  } catch (reason) {
    if (!(reason instanceof ApiConnectionError)) throw reason;
    localDemoModeEnabled = true;
    return await fallback();
  }
}

async function readDemoTodos() {
  const raw = await AsyncStorage.getItem(DEMO_TODOS_KEY);
  if (!raw) return [] as Todo[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Todo[]) : [];
  } catch {
    return [] as Todo[];
  }
}

async function writeDemoTodos(items: Todo[]) {
  await AsyncStorage.setItem(DEMO_TODOS_KEY, JSON.stringify(items));
}

function todayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export class ApiHttpError extends Error {
  status: number;
  code?: string;
  details?: ApiErrorDetails;

  constructor(status: number, message: string, code?: string, details?: ApiErrorDetails) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiErrorDetails = {
  suggestion?: string;
  retryAfterSeconds?: number;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetails;
  };
};

export type HomeFeedItem = {
  id: number;
  title: string;
  summary: string;
  cityName: string;
  district: string;
  mood: string;
  moodTags: string[];
  category: string;
  budgetYuan: number;
  accentColor: string;
};

type HomeFeedResponse = {
  items: HomeFeedItem[];
  total: number;
  limit: number;
  offset: number;
};

type DiaryFeedQuery = {
  moods?: string[];
  keyword?: string;
  sort?: 'latest' | 'popular';
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
};

type HomeFeedQuery = {
  channel?: string;
  cityId?: number;
  limit?: number;
  offset?: number;
};

type UserProfileUpdateInput = {
  nickname?: string;
};

type UserProfileUpdateResult = {
  persisted: boolean;
  profile: UserProfileUpdateInput;
};

type ApiRequestOptions = {
  auth?: boolean;
  /** 预期内的 HTTP 状态码，不打印 console.error（如启动时校验登录态的 401） */
  expectedStatuses?: number[];
  timeoutMs?: number;
};

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  authOrOptions: boolean | ApiRequestOptions = true,
): Promise<T> {
  const options: ApiRequestOptions =
    typeof authOrOptions === 'boolean' ? { auth: authOrOptions } : { auth: true, ...authOrOptions };

  let response: Response;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (options.auth !== false) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timeoutMs = options.timeoutMs ?? API_REQUEST_TIMEOUT_MS;
  const timeout = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller?.signal ?? init?.signal,
    });
  } catch {
    throw new ApiConnectionError(
      controller?.signal.aborted ? '请求超时，请稍后重试' : undefined,
    );
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  const body = (await response.json().catch(() => ({}))) as ApiResponse<T> & ApiErrorBody;

  if (!response.ok) {
    const isExpected = options.expectedStatuses?.includes(response.status) ?? false;
    if (!isExpected) {
      console.error('API 请求失败', {
        path,
        status: response.status,
        code: body.error?.code,
      });
    }
    const suggestion = body.error?.details?.suggestion;
    throw new ApiHttpError(
      response.status,
      [body.error?.message ?? '请求失败', suggestion].filter(Boolean).join('。'),
      body.error?.code,
      body.error?.details,
    );
  }

  return body.data;
}

export function isApiConnectionError(reason: unknown) {
  return reason instanceof ApiConnectionError;
}

export function isUnauthorizedApiError(reason: unknown) {
  return reason instanceof ApiHttpError && reason.status === 401;
}

export function getApiRetryAfterSeconds(reason: unknown) {
  if (!(reason instanceof ApiHttpError)) return null;

  const value = reason.details?.retryAfterSeconds;
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.ceil(value)
    : null;
}

export async function getCities() {
  return await withDemoFallback(
    () => apiRequest<City[]>('/cities', undefined, false),
    () => demoCities,
  );
}

export async function getPreferenceOptions() {
  return await withDemoFallback(
    () => apiRequest<PreferenceOptions>('/preferences/options', undefined, false),
    () => demoPreferenceOptions,
  );
}

export async function createGuestSession(deviceId: string) {
  return await withDemoFallback(
    () => apiRequest<GuestUser>('/session/guest', {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    }, false),
    () => createDemoGuest(deviceId),
  );
}

export async function requestAuthCode(email: string) {
  return await apiRequest<AuthCodeTicket>('/auth/code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, {
    auth: false,
    expectedStatuses: [429],
    // SMTP 投递常比普通读接口慢，不能沿用 4 秒的全局超时而主动取消请求。
    timeoutMs: AUTH_CODE_REQUEST_TIMEOUT_MS,
  });
}

export async function registerAccount(input: RegisterInput) {
  const data = await apiRequest<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  }, false);
  await setAuthToken(data.token);
  return data;
}

export async function loginAccount(input: LoginInput) {
  const data = await apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  }, false);
  await setAuthToken(data.token);
  return data;
}

export async function checkinToday() {
  return await apiRequest<WeekCheckinSummary & { alreadySigned: boolean }>(
    '/checkins/today',
    {
      method: 'POST',
    },
    { expectedStatuses: [401] },
  );
}

export async function getWeekCheckins() {
  return await apiRequest<WeekCheckinSummary>('/checkins/week', undefined, {
    expectedStatuses: [401],
  });
}

export async function getProfileProgress() {
  return await apiRequest<ProfileProgress>('/profile/progress', undefined, {
    expectedStatuses: [401],
  });
}

/** 启动时恢复登录态：无 token 或 token 失效时返回 null，不视为错误 */
export async function tryRestoreSession() {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    return await apiRequest<GuestUser>('/auth/me', undefined, {
      expectedStatuses: [401],
    });
  } catch (reason) {
    if (isApiConnectionError(reason)) return null;
    await clearAuthToken();
    return null;
  }
}

export async function logoutAccount() {
  await clearAuthToken();
}

export async function createVipAlipayPayment(returnUrl?: string) {
  return await apiRequest<VipPaymentCreateResponse>('/payments/alipay/vip-month', {
    method: 'POST',
    body: JSON.stringify(returnUrl ? { returnUrl } : {}),
  });
}

export async function getPaymentOrder(orderNo: string) {
  return await apiRequest<PaymentOrder>(`/payments/orders/${encodeURIComponent(orderNo)}`);
}

export async function updateUserProfile(
  input: UserProfileUpdateInput,
): Promise<UserProfileUpdateResult> {
  const user = await apiRequest<GuestUser>('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return {
    persisted: true,
    profile: {
      ...(typeof user.nickname === 'string' ? { nickname: user.nickname } : {}),
    },
  };
}

export async function uploadUserAvatar(input: {
  userId: number;
  imageBase64: string;
  mimeType?: string;
  localUri: string;
}) {
  return await apiRequest<{ avatarUri: string; mimeType: string; sizeBytes: number }>(
    `/users/${input.userId}/avatar`,
    {
      method: 'POST',
      body: JSON.stringify({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
      }),
    },
  );
}

export async function deleteUserAvatar(userId: number) {
  return await apiRequest<{ avatarUri: null }>(`/users/${userId}/avatar`, {
    method: 'DELETE',
  });
}

export async function uploadCompletionAttachment(input: {
  todoId: number;
  mediaBase64: string;
  mimeType?: string;
  localUri: string;
}) {
  return await apiRequest<{
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    uri?: string;
  }>(`/todos/${input.todoId}/attachments`, {
    method: 'POST',
    body: JSON.stringify({
      mediaBase64: input.mediaBase64,
      mimeType: input.mimeType,
    }),
  });
}

export async function submitTodoCompletion(input: {
  todoId: number;
  feelingText: string;
  visibility: CompletionVisibility;
  attachments: CompletionAttachmentInput[];
}) {
  const payload: CompletionSubmissionRequest = {
    feelingText: input.feelingText,
    visibility: input.visibility,
    attachments: input.attachments,
  };

  return await apiRequest<CompletionSubmissionResult>(`/todos/${input.todoId}/completion`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createOrContinueDraw(input: DrawRequest) {
  const result = await withDemoFallback(
    () => apiRequest<DrawResult>('/draws', {
      method: 'POST',
      body: JSON.stringify(normalizeDrawRequestForApi(input)),
    }, {
      timeoutMs: DRAW_REQUEST_TIMEOUT_MS,
    }),
    () => {
      demoCurrentDraw = createDemoDraw(input);
      return demoCurrentDraw;
    },
  );
  return {
    ...result,
    activity: normalizeActivity(result.activity),
  };
}

export async function rerollDraw(input: DrawRequest & { drawSessionId: string }) {
  const result = await withDemoFallback(
    () => apiRequest<DrawResult>('/draws', {
      method: 'POST',
      body: JSON.stringify(input),
    }, {
      timeoutMs: DRAW_REQUEST_TIMEOUT_MS,
    }),
    () => {
      demoCurrentDraw = createDemoDraw(input, demoCurrentDraw);
      return demoCurrentDraw;
    },
  );
  return {
    ...result,
    activity: normalizeActivity(result.activity),
  };
}

export async function getCurrentDraw() {
  try {
    const data = await apiRequest<DrawRestorePayload | null>('/draws/current', undefined, {
      expectedStatuses: [401],
    });
    if (!data?.draw) {
      return data;
    }

    return {
      draw: {
        ...data.draw,
        activity: normalizeActivity(data.draw.activity),
      },
      input: data.input,
    };
  } catch (reason) {
    if (isUnauthorizedApiError(reason)) return null;
    throw reason;
  }
}

export async function getHomeFeed(input: HomeFeedQuery = {}) {
  const channel = input.channel?.trim();
  const params = new URLSearchParams();

  if (typeof input.cityId === 'number' && Number.isFinite(input.cityId)) {
    params.set('cityId', String(input.cityId));
  }
  if (channel) {
    params.set('channel', channel);
  }
  if (typeof input.limit === 'number' && Number.isFinite(input.limit)) {
    params.set('limit', String(input.limit));
  }
  if (typeof input.offset === 'number' && Number.isFinite(input.offset)) {
    params.set('offset', String(input.offset));
  }

  const path = `/activities?${params.toString()}`;

  return await apiRequest<HomeFeedResponse>(path);
}

export async function getDiaryFeed(input: DiaryFeedQuery = {}) {
  const params = new URLSearchParams();

  if (typeof input.limit === 'number' && Number.isFinite(input.limit)) {
    params.set('limit', String(input.limit));
  }

  if (typeof input.offset === 'number' && Number.isFinite(input.offset)) {
    params.set('offset', String(input.offset));
  }

  if (input.moods?.length) {
    params.set('moods', input.moods.join(','));
  }

  if (input.keyword?.trim()) {
    params.set('keyword', input.keyword.trim());
  }

  if (input.sort) {
    params.set('sort', input.sort);
  }

  if (input.favoritesOnly) {
    params.set('favoritesOnly', 'true');
  }

  const query = params.toString();
  const response = await apiRequest<DiaryListResponse>(query ? `/diaries?${query}` : '/diaries');
  return {
    ...response,
    items: response.items.map(normalizeDiaryItem),
  };
}

export async function getActivity(activityId: number) {
  const activity = await apiRequest<Activity>(`/activities/${activityId}`, undefined, false);
  return normalizeActivity(activity);
}

export async function getMyDiary(diaryId: number) {
  const response = await apiRequest<MyDiaryItem>(`/diaries/${diaryId}`);
  return normalizeDiaryItem(response);
}

export async function getDiaryComments(
  diaryId: number,
  options?: {
    limit?: number;
    offset?: number;
  },
) {
  const query = new URLSearchParams();
  if (typeof options?.limit === 'number' && Number.isFinite(options.limit)) {
    query.set('limit', String(options.limit));
  }

  if (typeof options?.offset === 'number' && Number.isFinite(options.offset)) {
    query.set('offset', String(options.offset));
  }

  const queryString = query.toString();
  const response = await apiRequest<DiaryCommentListResponse>(
    queryString ? `/diaries/${diaryId}/comments?${queryString}` : `/diaries/${diaryId}/comments`,
  );
  return {
    ...response,
    items: response.items.map(normalizeDiaryComment),
  };
}

export async function createDiaryComment(diaryId: number, input: DiaryCommentCreateRequest) {
  const response = await apiRequest<DiaryCommentItem>(`/diaries/${diaryId}/comments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return normalizeDiaryComment(response);
}

export async function toggleDiaryCommentLike(
  commentId: number,
  input: DiaryCommentLikeRequest,
) {
  return await apiRequest<DiaryCommentLikeResponse>(`/comments/${commentId}/like`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function toggleDiaryLike(
  diaryId: number,
  input: DiaryLikeRequest,
) {
  return await apiRequest<DiaryLikeResponse>(`/diaries/${diaryId}/like`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function toggleDiaryFavorite(
  diaryId: number,
  input: DiaryFavoriteRequest,
) {
  return await apiRequest<DiaryFavoriteResponse>(`/diaries/${diaryId}/favorite`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function toggleDiaryHidden(
  diaryId: number,
  input: DiaryHiddenRequest,
) {
  return await apiRequest<DiaryHiddenResponse>(`/diaries/${diaryId}/hidden`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function reportDiary(
  diaryId: number,
  input: DiaryReportRequest,
) {
  return await apiRequest<DiaryReportResponse>(`/diaries/${diaryId}/report`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getCommunityOverview() {
  const response = await apiRequest<CommunityOverviewResponse>('/community/overview');
  return {
    ...response,
    activeUsers: response.activeUsers.map((item) => ({
      ...item,
      avatarUri: resolveApiMediaUrl(item.avatarUri),
    })),
  };
}

export async function toggleCommunityUserFollow(
  userId: number,
  input: CommunityFollowRequest,
) {
  return await apiRequest<CommunityFollowResponse>(`/community/users/${userId}/follow`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function addTodo(input: {
  userId?: number;
  activityId: number;
  drawSessionId?: string | null;
  scheduledDate?: string;
}) {
  return await withDemoFallback(
    () => apiRequest<{ id: number; alreadyExists: boolean }>('/todos', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        drawSessionId: normalizeDrawSessionIdForApi(input.drawSessionId),
      }),
    }),
    async () => {
      const items = await readDemoTodos();
      // 已完成的行程是历史记录，不应阻止用户再次加入同一玩法。
      const existing = items.find(
        (item) => item.activityId === input.activityId && ['pending', 'in_progress'].includes(item.status),
      );
      if (existing) return { id: existing.id, alreadyExists: true };

      const activity = demoActivities.find((item) => item.id === input.activityId) ?? demoCurrentDraw?.activity;
      if (!activity) throw new Error('没有找到可以加入行程的玩法');
      const nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const now = new Date().toISOString();
      const todo: Todo = {
        id: nextId,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: now,
        scheduledDate: input.scheduledDate ?? todayDateString(),
        activityId: activity.id,
        title: activity.title,
        summary: activity.summary,
        durationMinutes: activity.durationMinutes,
        budgetYuan: activity.budgetYuan,
        district: activity.district,
        address: activity.address,
        navigationUrl: activity.navigationUrl,
        accentColor: activity.accentColor,
        cityName: activity.cityName,
      };
      await writeDemoTodos([todo, ...items]);
      return { id: todo.id, alreadyExists: false };
    },
  );
}

export async function getTodos(userId?: number) {
  const query = typeof userId === 'number' && Number.isFinite(userId)
    ? `?${new URLSearchParams({ userId: String(userId) }).toString()}`
    : '';

  return await withDemoFallback(
    () => apiRequest<Todo[]>(`/todos${query}`),
    readDemoTodos,
  );
}

export async function updateTodoStatus(todoId: number, status: TodoStatus, userId?: number) {
  return await withDemoFallback(
    () => apiRequest<{ id: number; status: TodoStatus }>(`/todos/${todoId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(typeof userId === 'number' && Number.isFinite(userId) ? { userId } : {}),
      }),
    }),
    async () => {
      const items = await readDemoTodos();
      const now = new Date().toISOString();
      const next = items.map((item) => item.id === todoId ? {
        ...item,
        status,
        startedAt: status === 'in_progress' ? now : item.startedAt,
        completedAt: status === 'completed' ? now : item.completedAt,
        cancelledAt: status === 'cancelled' ? now : item.cancelledAt,
      } : item);
      await writeDemoTodos(next);
      return { id: todoId, status };
    },
  );
}

export async function startTodo(todoId: number, userId?: number) {
  return await withDemoFallback(
    () => apiRequest<{ id: number; status: TodoStatus }>(`/todos/${todoId}/start`, {
      method: 'PATCH',
      body: JSON.stringify(
        typeof userId === 'number' && Number.isFinite(userId) ? { userId } : {},
      ),
    }),
    async () => {
      const items = await readDemoTodos();
      const startedAt = new Date().toISOString();
      const next = items.map((item) => item.id === todoId
        ? { ...item, status: 'in_progress' as const, startedAt }
        : item);
      await writeDemoTodos(next);
      return { id: todoId, status: 'in_progress' as const };
    },
  );
}

export async function getMyDiaries(
  userId: number,
  options?: {
    visibility?: string[];
    moods?: string[];
    limit?: number;
    offset?: number;
  },
) {
  const response = await getMyDiariesRawResponse(userId, options);
  return response.items as MyDiaryItem[];
}

export async function getMyDiariesRawResponse(
  userId: number,
  options?: {
    visibility?: string[];
    moods?: string[];
    limit?: number;
    offset?: number;
  },
): Promise<DiaryListResponse> {
  const params = new URLSearchParams();
  params.set('userId', String(userId));

  if (options?.visibility?.length) {
    params.set('visibility', options.visibility.join(','));
  }
  if (options?.moods?.length) {
    params.set('moods', options.moods.join(','));
  }
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset != null) {
    params.set('offset', String(options.offset));
  }

  const response = await apiRequest<DiaryListResponse>(`/diaries?${params.toString()}`);
  return {
    ...response,
    items: response.items.map(normalizeDiaryItem),
  };
}

export async function getHistoryRecords(
  userId: number,
  options?: {
    status?: ('completed' | 'expired' | 'abandoned')[];
    limit?: number;
    offset?: number;
  },
) {
  const params = new URLSearchParams();
  params.set('userId', String(userId));

  if (options?.status?.length) {
    params.set('status', options.status.join(','));
  }
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset != null) {
    params.set('offset', String(options.offset));
  }

  const response = await apiRequest<HistoryListResponse>(`/history?${params.toString()}`);
  return response.items as HistoryItem[];
}
