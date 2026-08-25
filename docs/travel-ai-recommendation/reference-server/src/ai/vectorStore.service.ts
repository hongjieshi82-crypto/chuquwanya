import { randomUUID } from "node:crypto";

import { QdrantClient } from "@qdrant/js-client-rest";

import { env } from "../config/env.js";
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
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: env.qdrant.url,
      apiKey: env.qdrant.apiKey,
    });
  }

  async ensureCollection(name: string, dimensions: number) {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === name);
    if (exists) return;

    await this.client.createCollection(name, {
      vectors: {
        size: dimensions,
        distance: "Cosine",
      },
    });
  }

  async upsert(collection: string, points: VectorPoint[]) {
    if (points.length === 0) return;
    await this.ensureCollection(collection, embeddingService.dimensions);
    await this.client.upsert(collection, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  }

  async search(
    collection: string,
    vector: number[],
    limit: number,
    filter?: Record<string, unknown>,
  ): Promise<VectorSearchResult[]> {
    await this.ensureCollection(collection, embeddingService.dimensions);

    const results = await this.client.query(collection, {
      query: vector,
      limit,
      with_payload: true,
      ...(filter ? { filter } : {}),
    });

    return (results.points ?? []).map((point) => ({
      id: String(point.id),
      score: point.score ?? 0,
      payload: (point.payload ?? {}) as Record<string, unknown>,
    }));
  }

  async delete(collection: string, ids: string[]) {
    if (ids.length === 0) return;
    await this.client.delete(collection, { wait: true, points: ids });
  }

  /** 景点入库时写入向量 */
  async upsertAttraction(input: {
    attractionId: number;
    destinationId: number;
    name: string;
    summary: string;
    tags: string[];
    pointId?: string;
  }): Promise<string> {
    const text = embeddingService.buildAttractionText(input);
    const vector = await embeddingService.embedOne(text);
    const pointId = input.pointId ?? randomUUID();

    await this.upsert(env.qdrant.collections.attractions, [
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

  /** 用户偏好向量写入 */
  async upsertUserPreference(input: {
    userId: number;
    preferenceText: string;
    pointId?: string;
  }): Promise<string> {
    const vector = await embeddingService.embedOne(input.preferenceText);
    const pointId = input.pointId ?? randomUUID();

    await this.upsert(env.qdrant.collections.users, [
      {
        id: pointId,
        vector,
        payload: {
          entity_type: "user_preference",
          user_id: input.userId,
        },
      },
    ]);

    return pointId;
  }
}

export const vectorStoreService = new VectorStoreService();
