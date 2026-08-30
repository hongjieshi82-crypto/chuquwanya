export type AdminContentItem = {
  id: number; cityId: number; cityName: string; title: string; summary: string; description: string;
  address: string; district: string; latitude: number | null; longitude: number | null;
  durationMinutes: number; budgetYuan: number; environment: 'indoor' | 'outdoor' | 'either';
  rainFriendly: 'yes' | 'no' | 'unknown'; heatSensitive: 'yes' | 'no' | 'unknown'; windSensitive: 'yes' | 'no' | 'unknown';
  weatherNotes: string | null; reservationRequired: 'yes' | 'no' | 'unknown'; reservationUrl: string | null;
  contentStatus: 'draft' | 'review' | 'published' | 'archived'; contentScore: number; qualityIssues: string[];
  sourceType: string | null; sourceUrl: string | null; sourceConfidence: number; coverImageUri: string | null; lastVerifiedAt: string | null;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}/admin/content${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? '内容审核请求失败');
  return body.data as T;
}

export function getAdminContent(params: { cityId?: number; status: string; query?: string; offset?: number }) {
  const search = new URLSearchParams({ status: params.status, limit: '30', offset: String(params.offset ?? 0) });
  if (params.cityId) search.set('cityId', String(params.cityId));
  if (params.query) search.set('query', params.query);
  return request<{ items: AdminContentItem[]; total: number; limit: number; offset: number }>(`/activities?${search}`);
}

export function updateAdminContent(id: number, input: Record<string, unknown>) {
  return request<AdminContentItem>(`/activities/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}
