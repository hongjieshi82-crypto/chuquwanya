export const contentPlatforms = ['official', 'amap', 'xiaohongshu', 'douyin', 'bilibili', 'wechat', 'user', 'manual'] as const;
export type ContentPlatform = (typeof contentPlatforms)[number];

export type ContentSourceInput = {
  platform: ContentPlatform;
  url?: string | null;
  title?: string | null;
  author?: string | null;
  signals?: string[];
  usageRole?: 'fact' | 'inspiration' | 'both';
  rightsNote?: string | null;
};

function clean(value: unknown, max: number) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result ? result.slice(0, max) : null;
}

export function normalizeContentSource(value: unknown): ContentSourceInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const platform = clean(input.platform, 32) as ContentPlatform | null;
  if (!platform || !contentPlatforms.includes(platform)) return null;
  const signals = Array.isArray(input.signals)
    ? Array.from(new Set(input.signals.map((item) => clean(item, 80)).filter((item): item is string => Boolean(item)))).slice(0, 20)
    : [];
  return {
    platform,
    url: clean(input.url, 700),
    title: clean(input.title, 255),
    author: clean(input.author, 120),
    signals,
    usageRole: input.usageRole === 'fact' || input.usageRole === 'both' ? input.usageRole : 'inspiration',
    rightsNote: clean(input.rightsNote, 255) ?? '仅提炼事实或玩法趋势，不复制原文、图片或视频',
  };
}
