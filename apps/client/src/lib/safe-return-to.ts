import type { ImperativeRouter } from 'expo-router';

/** 仅允许应用内相对路径，避免 open redirect */
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }
  return value;
}

export function backOrReplace(router: ImperativeRouter, fallback: '/' | '/profile' = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
