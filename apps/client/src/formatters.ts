export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} 小时` : `${hours.toFixed(1)} 小时`;
}

export function formatBudget(value: number) {
  if (value <= 50) return '0-50元';
  if (value <= 100) return '50-100元';
  return '100元以上';
}

export function formatDistanceMetric(value: number, recommendationDistance?: string) {
  const summary = recommendationDistance?.trim() ?? '';
  const needsMapConfirmation = summary.includes('地图确认') || summary.includes('缺少坐标');
  const match = summary.match(/约?\s*\d+(?:\.\d+)?(?:\s*(?:-|~|至|到)\s*\d+(?:\.\d+)?)?\s*(?:km|公里)/i);

  if (needsMapConfirmation && !summary.includes('AI估算')) {
    return '地图确认';
  }

  if (match && !/^约?\s*0(?:\.0+)?\s*(?:km|公里)$/i.test(match[0].trim())) {
    return match[0].replace(/\s+/g, ' ');
  }

  if (needsMapConfirmation) {
    return '地图确认';
  }

  return `${value.toFixed(1)} km`;
}

export function formatEnvironment(value: 'indoor' | 'outdoor' | 'either') {
  const labels = {
    indoor: '室内',
    outdoor: '室外',
    either: '不限',
  };
  return labels[value];
}
