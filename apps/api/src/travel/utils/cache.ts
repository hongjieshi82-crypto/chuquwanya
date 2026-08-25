import { createHash } from "node:crypto";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** 轻量内存缓存；生产环境可替换为 Redis */
export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private defaultTtlSeconds: number) {}

  static hashKey(input: unknown): string {
    return createHash("sha256").update(JSON.stringify(input)).digest("hex");
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlSeconds = this.defaultTtlSeconds) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}
