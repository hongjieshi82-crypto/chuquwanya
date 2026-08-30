export type ContentStatus = "draft" | "review" | "published" | "archived";
export type ReservationRequirement = "yes" | "no" | "unknown";

export type QualityActivity = {
  city_id?: number | null;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  duration_minutes?: number | null;
  budget_yuan?: number | null;
  environment?: string | null;
  rain_friendly?: string | null;
  heat_sensitive?: string | null;
  wind_sensitive?: string | null;
  navigation_url?: string | null;
  cover_image?: string | null;
  steps?: unknown;
  tips?: unknown;
  opening_hours?: unknown;
  reservation_required?: ReservationRequirement | null;
  source_type?: string | null;
  source_url?: string | null;
  last_verified_at?: string | Date | null;
};

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArrayItems(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (!hasText(value)) return false;
  try {
    const parsed = JSON.parse(value as string);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function hasObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) return Object.keys(value).length > 0;
  if (!hasText(value)) return false;
  try {
    const parsed = JSON.parse(value as string);
    return Boolean(parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length > 0);
  } catch {
    return false;
  }
}

export function assessContentQuality(activity: QualityActivity) {
  let score = 0;
  const issues: string[] = [];

  if (activity.city_id && hasText(activity.title) && hasText(activity.summary) && hasText(activity.description)) score += 10;
  else issues.push("基础文案不完整");

  if (hasText(activity.address) && activity.latitude != null && activity.longitude != null) score += 15;
  else issues.push("地址或坐标缺失");

  if (activity.duration_minutes != null && activity.duration_minutes > 0 && activity.budget_yuan != null && activity.budget_yuan >= 0) score += 15;
  else issues.push("预算或时长缺失");

  if (activity.environment && activity.rain_friendly && activity.rain_friendly !== "unknown" && activity.heat_sensitive && activity.wind_sensitive) score += 15;
  else issues.push("天气适用性未核验");

  if (hasArrayItems(activity.steps) && hasArrayItems(activity.tips)) score += 15;
  else issues.push("玩法步骤或注意事项缺失");

  if (hasText(activity.navigation_url)) score += 5;
  else issues.push("导航入口缺失");
  if (hasText(activity.cover_image)) score += 5;
  else issues.push("封面缺失");

  if (hasObject(activity.opening_hours)) score += 5;
  else issues.push("营业时间未核验");
  if (activity.reservation_required && activity.reservation_required !== "unknown") score += 5;
  else issues.push("预约要求未核验");

  if (hasText(activity.source_type) && (hasText(activity.source_url) || activity.source_type === "manual")) score += 5;
  else issues.push("内容来源不完整");
  if (activity.last_verified_at) score += 5;
  else issues.push("缺少最后核验时间");

  return {
    score,
    issues,
    recommendable: score >= 70 && !issues.includes("地址或坐标缺失") && !issues.includes("预算或时长缺失") && !issues.includes("天气适用性未核验"),
  };
}
