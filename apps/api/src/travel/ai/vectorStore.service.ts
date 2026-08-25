import { randomUUID } from "node:crypto";

import { QdrantClient } from "@qdrant/js-client-rest";

import { config } from "../../config.js";
import { embeddingService } from "./embedding.service.js";

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

class VectorStoreService {
  private client: QdrantClient | null = null;

  private getClient() {
    if (!this.client) {
      this.client = new QdrantClient({
        url: config.ai.qdrant.url,
        apiKey: config.ai.qdrant.apiKey,
        // 本地未启动 Qdrant 时不做版本探测，避免控制台警告
        checkCompatibility: false,
      });
    }
    return this.client;
  }

  isAvailable() {
    return embeddingService.isAvailable();
  }

  async ensureCollection(name: string, dimensions: number) {
    const collections = await this.getClient().getCollections();
    if (collections.collections.some((c) => c.name === name)) return;
    await this.getClient().createCollection(name, {
      vectors: { size: dimensions, distance: "Cosine" },
    });
  }

  async upsert(collection: string, points: VectorPoint[]) {
    if (points.length === 0 || !this.isAvailable()) return;
    await this.ensureCollection(collection, embeddingService.dimensions);
    await this.getClient().upsert(collection, {
      wait: true,
      points: points.map((p) => ({ id: p.id, vector: p.vector, payload: p.payload })),
    });
  }

  async search(
    collection: string,
    vector: number[],
    limit: number,
  ): Promise<VectorSearchResult[]> {
    if (!this.isAvailable()) return [];
    await this.ensureCollection(collection, embeddingService.dimensions);
    const results = await this.getClient().query(collection, {
      query: vector,
      limit,
      with_payload: true,
    });
    return (results.points ?? []).map((point) => ({
      id: String(point.id),
      score: point.score ?? 0,
      payload: (point.payload ?? {}) as Record<string, unknown>,
    }));
  }

  async delete(collection: string, ids: string[]) {
    if (ids.length === 0) return;
    await this.getClient().delete(collection, { wait: true, points: ids });
  }

  async upsertAttraction(input: {
    attractionId: number;
    destinationId: number;
    name: string;
    summary: string;
    tags: string[];
    pointId?: string;
  }) {
    const text = embeddingService.buildAttractionText(input);
    const vector = await embeddingService.embedOne(text);
    const pointId = input.pointId ?? randomUUID();
    await this.upsert(config.ai.qdrant.collections.attractions, [
      {
        id: pointId,
        vector,
        payload: {
          entity_type: "attraction",
          attraction_id: input.attractionId,
          destination_id: input.destinationId,
          name: input.name,
          tags: input.tags,
        },
      },
    ]);
    return pointId;
  }

  async upsertUserPreference(input: { userId: number; preferenceText: string; pointId?: string }) {
    const vector = await embeddingService.embedOne(input.preferenceText);
    const pointId = input.pointId ?? randomUUID();
    await this.upsert(config.ai.qdrant.collections.users, [
      {
        id: pointId,
        vector,
        payload: { entity_type: "user_preference", user_id: input.userId },
      },
    ]);
    return pointId;
  }
}

export const vectorStoreService = new VectorStoreService();
