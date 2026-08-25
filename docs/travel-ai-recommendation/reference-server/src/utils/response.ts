import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export function success<T>(res: Response, data: T, message = "success") {
  res.json({ code: 0, message, data } satisfies ApiResponse<T>);
}

export function fail(
  res: Response,
  status: number,
  code: number,
  message: string,
  data: null = null,
) {
  res.status(status).json({ code, message, data } satisfies ApiResponse<null>);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function normalizeScore(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
