const key = 'chuquwanya:nearby-history:v1';
const ttl = 7 * 24 * 3600_000;
export function readNearbyHistory(): string[] {
  try {
    const entries = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(entries) ? entries.filter(e => typeof e?.id === 'string' && Number.isFinite(e.at) && Date.now() - e.at < ttl).slice(-100).map(e => e.id) : [];
  } catch { return []; }
}
export function readNearbyPlaceNames(): string[] {
  try {
    const entries = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(entries) ? entries.filter(e => typeof e?.name === 'string' && Number.isFinite(e.at) && Date.now() - e.at < ttl).slice(-100).map(e => e.name) : [];
  } catch { return []; }
}
export function rememberNearbyPlace(id: string, name?: string, parentId?: string | null) {
  try {
    const entries = JSON.parse(localStorage.getItem(key) || '[]');
    const valid = Array.isArray(entries) ? entries.filter(e => typeof e?.id === 'string' && Number.isFinite(e.at) && Date.now() - e.at < ttl && e.id !== id) : [];
    const added = [{ id, name, at: Date.now() }, ...(parentId ? [{ id: parentId, at: Date.now() }] : [])];
    localStorage.setItem(key, JSON.stringify([...valid, ...added].slice(-100)));
  } catch { /* Private browsers may disable persistent storage. */ }
}
