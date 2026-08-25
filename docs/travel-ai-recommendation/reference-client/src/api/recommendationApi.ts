import axios from "axios";
import type { RecommendRequest, RecommendResponse } from "../types/recommendation";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3002/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = globalThis.__AUTH_TOKEN__;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const recommendationApi = {
  async getAiRecommendations(params: RecommendRequest): Promise<RecommendResponse> {
    const { data } = await api.post<{ code: number; data: RecommendResponse }>(
      "/recommendations/ai",
      params,
    );
    return data.data;
  },
};

export const searchApi = {
  async semanticSearch(query: string, target: "all" | "attraction" | "destination" = "all") {
    const { data } = await api.post("/search/semantic", { query, target });
    return data.data;
  },
};

export const tripApi = {
  generateTripStream(
    params: Record<string, unknown>,
    onDelta: (text: string) => void,
    onDone: (full: string) => void,
  ) {
    const url = `${api.defaults.baseURL}/trips/ai-generate`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setResponseType("text";

    let lastIndex = 0;
    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(lastIndex);
      lastIndex = xhr.responseText.length;
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const payload = JSON.parse(line.slice(6)) as { delta: string; done: boolean; full?: string };
          if (payload.delta) onDelta(payload.delta);
          if (payload.done && payload.full) onDone(payload.full);
        } catch {
          // 忽略不完整 chunk
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 400) onDone("");
    };

    xhr.send(JSON.stringify({ ...params, stream: true }));
    return () => xhr.abort();
  },
};

declare global {
  // eslint-disable-next-line no-var
  var __AUTH_TOKEN__: string | undefined;
}
