import type { Preferences } from '@/types';

const PENDING_PC_BOX_DRAW_KEY = 'lazyde:pc-box:pending-draw';
const PENDING_PC_BOX_DRAW_TTL_MS = 30 * 60 * 1_000;

export type PendingPcBoxDraw = {
  cityId: number;
  preferences: Preferences;
  summary: string;
  destinationId?: number;
  destinationName?: string;
  createdAt: number;
};

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function savePendingPcBoxDraw(input: Omit<PendingPcBoxDraw, 'createdAt'>) {
  if (!canUseSessionStorage()) return false;

  try {
    window.sessionStorage.setItem(
      PENDING_PC_BOX_DRAW_KEY,
      JSON.stringify({ ...input, createdAt: Date.now() } satisfies PendingPcBoxDraw),
    );
    return true;
  } catch {
    return false;
  }
}

export function readPendingPcBoxDraw(): PendingPcBoxDraw | null {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(PENDING_PC_BOX_DRAW_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingPcBoxDraw>;
    const isValid =
      typeof parsed.cityId === 'number' &&
      Number.isFinite(parsed.cityId) &&
      typeof parsed.summary === 'string' &&
      typeof parsed.createdAt === 'number' &&
      parsed.preferences !== null &&
      typeof parsed.preferences === 'object';

    if (!isValid || Date.now() - parsed.createdAt! > PENDING_PC_BOX_DRAW_TTL_MS) {
      clearPendingPcBoxDraw();
      return null;
    }

    return parsed as PendingPcBoxDraw;
  } catch {
    clearPendingPcBoxDraw();
    return null;
  }
}

export function clearPendingPcBoxDraw() {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(PENDING_PC_BOX_DRAW_KEY);
  } catch {
    // Storage can be unavailable in restricted/private browser contexts.
  }
}
