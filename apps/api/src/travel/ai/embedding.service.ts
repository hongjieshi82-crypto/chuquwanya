import OpenAI from "openai";

import { config, isAiConfigured } from "../../config.js";
import { AppError } from "../../errors.js";
import { TtlCache } from "../utils/cache.js";

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
}

class OpenAiEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  dimensions: number;

  constructor() {
    this.client = new OpenAI({ apiKey: config.ai.openai.apiKey });
    this.dimensions = config.ai.openai.embeddingDimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: config.ai.openai.embeddingModel,
      input: texts,
      dimensions: this.dimensions,
    });
    return response.data.map((item) => item.embedding);
  }
}

class ZhipuEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  dimensions = 1024;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.zhipu.apiKey,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: config.ai.zhipu.embeddingModel,
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  }
}

class SiliconFlowEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  dimensions: number;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.siliconflow.apiKey,
      baseURL: config.ai.siliconflow.baseUrl,
    });
    this.dimensions = config.ai.siliconflow.embeddingDimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: config.ai.siliconflow.embeddingModel,
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  }
}

const embeddingCache = new TtlCache<number[]>(3600);

function createProvider(): EmbeddingProvider | null {
  if (!isAiConfigured()) return null;
  if (config.ai.embeddingProvider === "siliconflow" && config.ai.siliconflow.apiKey) {
    return new SiliconFlowEmbeddingProvider();
  }
  if (config.ai.embeddingProvider === "zhipu" && config.ai.zhipu.apiKey) {
    return new ZhipuEmbeddingProvider();
  }
  if (config.ai.openai.apiKey) {
    return new OpenAiEmbeddingProvider();
  }
  return null;
}

let provider = createProvider();

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw lastError;
}

export const embeddingService = {
  get dimensions() {
    return provider?.dimensions ?? config.ai.openai.embeddingDimensions;
  },

  isAvailable() {
    return provider !== null;
  },

  async embedOne(text: string): Promise<number[]> {
    if (!provider) {
      throw new AppError(503, "AI_NOT_CONFIGURED", "未配置 Embedding API，请在 .env 中设置 OPENAI_API_KEY");
    }
    const cached = embeddingCache.get(text);
    if (cached) return cached;
    const [vector] = await withRetry(() => provider!.embed([text]));
    if (!vector) throw new Error("Embedding API returned empty result");
    embeddingCache.set(text, vector);
    return vector;
  },

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!provider) {
      throw new AppError(503, "AI_NOT_CONFIGURED", "未配置 Embedding API");
    }
    const uncached: { index: number; text: string }[] = [];
    const results: number[][] = new Array(texts.length);

    texts.forEach((text, index) => {
      const cached = embeddingCache.get(text);
      if (cached) results[index] = cached;
      else uncached.push({ index, text });
    });

    if (uncached.length > 0) {
      const batchSize = 64;
      for (let i = 0; i < uncached.length; i += batchSize) {
        const chunk = uncached.slice(i, i + batchSize);
        const vectors = await withRetry(() => provider!.embed(chunk.map((c) => c.text)));
        chunk.forEach((item, j) => {
          const vector = vectors[j];
          if (!vector) throw new Error("Embedding batch missing vector");
          embeddingCache.set(item.text, vector);
          results[item.index] = vector;
        });
      }
    }

    return results;
  },

  buildAttractionText(input: { name: string; summary: string; tags: string[] }) {
    return [input.name, input.summary, input.tags.join(" ")].filter(Boolean).join(" | ");
  },

  buildUserPreferenceText(input: {
    preferences: string[];
    tripType?: string;
    destination?: string;
    budget?: number;
    season?: string;
  }) {
    return [
      input.destination ? `目的地：${input.destination}` : "",
      input.tripType ? `出行类型：${input.tripType}` : "",
      input.season ? `季节：${input.season}` : "",
      input.budget ? `预算：${input.budget}元` : "",
      `偏好：${input.preferences.join("、")}`,
    ]
      .filter(Boolean)
      .join("；");
  },
};

export function resetEmbeddingProvider() {
  provider = createProvider();
}
