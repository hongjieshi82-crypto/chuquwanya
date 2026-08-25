import type { Pool } from "mysql2/promise";

import { env } from "../../config/env.js";
import { embeddingService } from "../../ai/embedding.service.js";
import { vectorStoreService } from "../../ai/vectorStore.service.js";

export type SemanticSearchTarget = "attraction" | "destination" | "all";

export interface SemanticSearchResult {
  id: number;
  type: "attraction" | "destination";
  name: string;
  summary: string;
  score: number;
  tags: string[];
}

export class SemanticSearchService {
  constructor(private pool: Pool) {}

  async search(
    query: string,
    target: SemanticSearchTarget = "all",
    limit = 20,
  ): Promise<SemanticSearchResult[]> {
    const vector = await embeddingService.embedOne(query);
    const results: SemanticSearchResult[] = [];

    if (target === "attraction" || target === "all") {
      const hits = await vectorStoreService.search(
        env.qdrant.collections.attractions,
        vector,
        limit,
      );
      for (const hit of hits) {
        const id = Number(hit.payload.attraction_id);
        if (!id) continue;
        const detail = await this.getAttractionDetail(id);
        if (detail) {
          results.push({ ...detail, score: hit.score });
        }
      }
    }

    if (target === "destination" || target === "all") {
      const hits = await vectorStoreService.search(
        env.qdrant.collections.destinations,
        vector,
        limit,
      );
      for (const hit of hits) {
        const id = Number(hit.payload.destination_id);
        if (!id) continue;
        const detail = await this.getDestinationDetail(id);
        if (detail) {
          results.push({ ...detail, score: hit.score });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async getAttractionDetail(id: number): Promise<SemanticSearchResult | null> {
    const [rows] = await this.pool.execute(
      `SELECT a.id, a.name, a.summary, GROUP_CONCAT(t.name) AS tags
       FROM attractions a
       LEFT JOIN attraction_tags at ON at.attraction_id = a.id
       LEFT JOIN tags t ON t.id = at.tag_id
       WHERE a.id = ? AND a.is_active = TRUE
       GROUP BY a.id`,
      [id],
    );
    const row = (rows as Array<Record<string, unknown>>)[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      type: "attraction",
      name: String(row.name),
      summary: String(row.summary),
      score: 0,
      tags: String(row.tags ?? "").split(",").filter(Boolean),
    };
  }

  private async getDestinationDetail(id: number): Promise<SemanticSearchResult | null> {
    const [rows] = await this.pool.execute(
      `SELECT d.id, d.name, d.summary, GROUP_CONCAT(t.name) AS tags
       FROM destinations d
       LEFT JOIN destination_tags dt ON dt.destination_id = d.id
       LEFT JOIN tags t ON t.id = dt.tag_id
       WHERE d.id = ? AND d.is_active = TRUE
       GROUP BY d.id`,
      [id],
    );
    const row = (rows as Array<Record<string, unknown>>)[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      type: "destination",
      name: String(row.name),
      summary: String(row.summary),
      score: 0,
      tags: String(row.tags ?? "").split(",").filter(Boolean),
    };
  }
}
