import type { Pool } from "mysql2/promise";

import { config } from "../../config.js";
import { embeddingService } from "../ai/embedding.service.js";
import { vectorStoreService, type VectorSearchResult } from "../ai/vectorStore.service.js";
import { cosineSimilarity } from "../utils/scoring.js";

export interface AttractionCandidate {
  attractionId: number;
  name: string;
  destinationId: number;
  rating: number;
  popularity: number;
  ticketPriceMax: number;
  bestSeasons: string[];
  suitableAudiences: string[];
  tags: string[];
  embeddingPointId?: string | null;
  recStrategies: Set<string>;
  semanticScore?: number;
  collaborativeScore?: number;
}

export interface RecallContext {
  userId?: number;
  destination?: string;
  destinationId?: number;
  preferences: string[];
  tripType?: string;
  budget?: number;
  season?: string;
  travelers?: number;
  days?: number;
}

const RECALL_LIMIT = 80;

export class RecallService {
  constructor(private pool: Pool) {}

  /** 标签召回：MySQL JOIN 匹配偏好标签 */
  async tagRecall(ctx: RecallContext): Promise<AttractionCandidate[]> {
    if (ctx.preferences.length === 0) return [];

    const placeholders = ctx.preferences.map(() => "?").join(",");
    const params: unknown[] = [...ctx.preferences];

    let destinationFilter = "";
    if (ctx.destinationId) {
      destinationFilter = "AND a.destination_id = ?";
      params.push(ctx.destinationId);
    } else if (ctx.destination) {
      destinationFilter = "AND d.name LIKE ?";
      params.push(`%${ctx.destination}%`);
    }

    const [rows] = await this.pool.execute(
      `SELECT DISTINCT
         a.id AS attractionId,
         a.name,
         a.destination_id AS destinationId,
         a.rating,
         a.popularity,
         a.ticket_price_max AS ticketPriceMax,
         a.best_seasons AS bestSeasons,
         a.suitable_audiences AS suitableAudiences,
         a.embedding_point_id AS embeddingPointId,
         GROUP_CONCAT(t.name) AS tagNames
       FROM attractions a
       INNER JOIN destinations d ON d.id = a.destination_id
       INNER JOIN attraction_tags at ON at.attraction_id = a.id
       INNER JOIN travel_tags t ON t.id = at.tag_id
       WHERE a.is_active = TRUE
         AND t.name IN (${placeholders})
         ${destinationFilter}
       GROUP BY a.id
       ORDER BY a.popularity DESC, a.rating DESC
       LIMIT ?`,
      [...params, RECALL_LIMIT] as (string | number)[],
    );

    return (rows as Array<Record<string, unknown>>).map((row) => ({
      attractionId: Number(row.attractionId),
      name: String(row.name),
      destinationId: Number(row.destinationId),
      rating: Number(row.rating),
      popularity: Number(row.popularity),
      ticketPriceMax: Number(row.ticketPriceMax),
      bestSeasons: JSON.parse(String(row.bestSeasons ?? "[]")) as string[],
      suitableAudiences: JSON.parse(String(row.suitableAudiences ?? "[]")) as string[],
      tags: String(row.tagNames ?? "").split(",").filter(Boolean),
      embeddingPointId: row.embeddingPointId ? String(row.embeddingPointId) : null,
      recStrategies: new Set(["tag"]),
    }));
  }

  /** 语义召回：用户偏好文本 → Embedding → Qdrant Top-K */
  async semanticRecall(ctx: RecallContext): Promise<AttractionCandidate[]> {
    if (!embeddingService.isAvailable()) return [];
    const preferenceText = embeddingService.buildUserPreferenceText({
      preferences: ctx.preferences,
      tripType: ctx.tripType,
      destination: ctx.destination,
      budget: ctx.budget,
      season: ctx.season,
    });

    const vector = await embeddingService.embedOne(preferenceText);
    const hits = await vectorStoreService.search(
      config.ai.qdrant.collections.attractions,
      vector,
      RECALL_LIMIT,
    );

    if (hits.length === 0) return [];

    const ids = hits.map((h: VectorSearchResult) => Number(h.payload.attraction_id)).filter(Boolean);
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await this.pool.execute(
      `SELECT
         a.id AS attractionId,
         a.name,
         a.destination_id AS destinationId,
         a.rating,
         a.popularity,
         a.ticket_price_max AS ticketPriceMax,
         a.best_seasons AS bestSeasons,
         a.suitable_audiences AS suitableAudiences,
         a.embedding_point_id AS embeddingPointId,
         GROUP_CONCAT(t.name) AS tagNames
       FROM attractions a
       LEFT JOIN attraction_tags at ON at.attraction_id = a.id
       LEFT JOIN travel_tags t ON t.id = at.tag_id
       WHERE a.id IN (${placeholders}) AND a.is_active = TRUE
       GROUP BY a.id`,
      ids,
    );

    const scoreMap = new Map(
      hits.map((h: VectorSearchResult) => [Number(h.payload.attraction_id), h.score]),
    );

    return (rows as Array<Record<string, unknown>>).map((row) => ({
      attractionId: Number(row.attractionId),
      name: String(row.name),
      destinationId: Number(row.destinationId),
      rating: Number(row.rating),
      popularity: Number(row.popularity),
      ticketPriceMax: Number(row.ticketPriceMax),
      bestSeasons: JSON.parse(String(row.bestSeasons ?? "[]")) as string[],
      suitableAudiences: JSON.parse(String(row.suitableAudiences ?? "[]")) as string[],
      tags: String(row.tagNames ?? "").split(",").filter(Boolean),
      embeddingPointId: row.embeddingPointId ? String(row.embeddingPointId) : null,
      recStrategies: new Set(["semantic"]),
      semanticScore: scoreMap.get(Number(row.attractionId)) ?? 0,
    }));
  }

  /** 行为召回：收藏/评分/浏览 → 用户兴趣向量 → 与景点向量余弦相似 */
  async behaviorRecall(ctx: RecallContext): Promise<AttractionCandidate[]> {
    if (!ctx.userId || !embeddingService.isAvailable()) return [];

    const [historyRows] = await this.pool.execute(
      `SELECT target_id AS attractionId, target_type
       FROM (
         SELECT target_id, target_type, created_at FROM travel_favorites
           WHERE user_id = ? AND target_type = 'attraction'
         UNION ALL
         SELECT attraction_id AS target_id, 'attraction' AS target_type, created_at FROM travel_reviews
           WHERE user_id = ?
         UNION ALL
         SELECT target_id, target_type, created_at FROM browse_history
           WHERE user_id = ? AND target_type = 'attraction'
       ) h
       ORDER BY created_at DESC
       LIMIT 50`,
      [ctx.userId, ctx.userId, ctx.userId],
    );

    const attractionIds = [
      ...new Set(
        (historyRows as Array<{ attractionId: number }>).map((r) => Number(r.attractionId)),
      ),
    ];
    if (attractionIds.length === 0) return [];

    const placeholders = attractionIds.map(() => "?").join(",");
    const [rows] = await this.pool.execute(
      `SELECT
         a.id AS attractionId,
         a.name,
         a.destination_id AS destinationId,
         a.rating,
         a.popularity,
         a.ticket_price_max AS ticketPriceMax,
         a.best_seasons AS bestSeasons,
         a.suitable_audiences AS suitableAudiences,
         a.embedding_point_id AS embeddingPointId,
         GROUP_CONCAT(t.name) AS tagNames
       FROM attractions a
       LEFT JOIN attraction_tags at ON at.attraction_id = a.id
       LEFT JOIN travel_tags t ON t.id = at.tag_id
       WHERE a.id IN (${placeholders})
       GROUP BY a.id`,
      attractionIds,
    );

    const interacted = rows as Array<Record<string, unknown>>;
    const preferenceText = interacted
      .map((r) => `${r.name} ${r.tagNames ?? ""}`)
      .join("；");
    const userVector = await embeddingService.embedOne(preferenceText);

    const [allCandidates] = await this.pool.execute(
      `SELECT
         a.id AS attractionId,
         a.name,
         a.destination_id AS destinationId,
         a.rating,
         a.popularity,
         a.ticket_price_max AS ticketPriceMax,
         a.best_seasons AS bestSeasons,
         a.suitable_audiences AS suitableAudiences,
         a.embedding_point_id AS embeddingPointId,
         GROUP_CONCAT(t.name) AS tagNames
       FROM attractions a
       LEFT JOIN attraction_tags at ON at.attraction_id = a.id
       LEFT JOIN travel_tags t ON t.id = at.tag_id
       WHERE a.is_active = TRUE
         AND a.id NOT IN (${placeholders})
       GROUP BY a.id
       ORDER BY a.popularity DESC
       LIMIT 200`,
      attractionIds,
    );

    const scored: AttractionCandidate[] = [];
    for (const row of allCandidates as Array<Record<string, unknown>>) {
      const text = embeddingService.buildAttractionText({
        name: String(row.name),
        summary: String(row.tagNames ?? ""),
        tags: String(row.tagNames ?? "").split(",").filter(Boolean),
      });
      const attrVector = await embeddingService.embedOne(text);
      const sim = cosineSimilarity(userVector, attrVector);
      if (sim < 0.3) continue;

      scored.push({
        attractionId: Number(row.attractionId),
        name: String(row.name),
        destinationId: Number(row.destinationId),
        rating: Number(row.rating),
        popularity: Number(row.popularity),
        ticketPriceMax: Number(row.ticketPriceMax),
        bestSeasons: JSON.parse(String(row.bestSeasons ?? "[]")) as string[],
        suitableAudiences: JSON.parse(String(row.suitableAudiences ?? "[]")) as string[],
        tags: String(row.tagNames ?? "").split(",").filter(Boolean),
        embeddingPointId: row.embeddingPointId ? String(row.embeddingPointId) : null,
        recStrategies: new Set(["behavior"]),
        semanticScore: sim,
      });
    }

    return scored.sort((a, b) => (b.semanticScore ?? 0) - (a.semanticScore ?? 0)).slice(0, RECALL_LIMIT);
  }

  /** 协同过滤：找相似用户喜欢的未浏览景点 */
  async collaborativeRecall(ctx: RecallContext): Promise<AttractionCandidate[]> {
    if (!ctx.userId) return [];

    const [similarUsers] = await this.pool.execute(
      `SELECT other.user_id, COUNT(*) AS overlap
       FROM (
         SELECT user_id, target_id FROM travel_favorites WHERE target_type = 'attraction'
         UNION
         SELECT user_id, attraction_id AS target_id FROM travel_reviews WHERE rating >= 4
       ) other
       INNER JOIN (
         SELECT target_id FROM travel_favorites WHERE user_id = ? AND target_type = 'attraction'
         UNION
         SELECT attraction_id AS target_id FROM travel_reviews WHERE user_id = ? AND rating >= 4
       ) mine ON mine.target_id = other.target_id
       WHERE other.user_id != ?
       GROUP BY other.user_id
       ORDER BY overlap DESC
       LIMIT 20`,
      [ctx.userId, ctx.userId, ctx.userId],
    );

    const userIds = (similarUsers as Array<{ user_id: number }>).map((r) => r.user_id);
    if (userIds.length === 0) return [];

    const userPlaceholders = userIds.map(() => "?").join(",");
    const [rows] = await this.pool.execute(
      `SELECT
         a.id AS attractionId,
         a.name,
         a.destination_id AS destinationId,
         a.rating,
         a.popularity,
         a.ticket_price_max AS ticketPriceMax,
         a.best_seasons AS bestSeasons,
         a.suitable_audiences AS suitableAudiences,
         a.embedding_point_id AS embeddingPointId,
         COUNT(*) AS cfScore,
         GROUP_CONCAT(DISTINCT t.name) AS tagNames
       FROM (
         SELECT user_id, target_id AS attraction_id FROM travel_favorites WHERE target_type = 'attraction'
         UNION ALL
         SELECT user_id, attraction_id FROM travel_reviews WHERE rating >= 4
       ) acts
       INNER JOIN attractions a ON a.id = acts.attraction_id
       LEFT JOIN attraction_tags at ON at.attraction_id = a.id
       LEFT JOIN travel_tags t ON t.id = at.tag_id
       WHERE acts.user_id IN (${userPlaceholders})
         AND a.is_active = TRUE
         AND a.id NOT IN (
           SELECT target_id FROM travel_favorites WHERE user_id = ? AND target_type = 'attraction'
           UNION
           SELECT target_id FROM browse_history WHERE user_id = ? AND target_type = 'attraction'
         )
       GROUP BY a.id
       ORDER BY cfScore DESC, a.rating DESC
       LIMIT ?`,
      [...userIds, ctx.userId, ctx.userId, RECALL_LIMIT],
    );

    const maxCf = Math.max(
      ...(rows as Array<{ cfScore: number }>).map((r) => Number(r.cfScore)),
      1,
    );

    return (rows as Array<Record<string, unknown>>).map((row) => ({
      attractionId: Number(row.attractionId),
      name: String(row.name),
      destinationId: Number(row.destinationId),
      rating: Number(row.rating),
      popularity: Number(row.popularity),
      ticketPriceMax: Number(row.ticketPriceMax),
      bestSeasons: JSON.parse(String(row.bestSeasons ?? "[]")) as string[],
      suitableAudiences: JSON.parse(String(row.suitableAudiences ?? "[]")) as string[],
      tags: String(row.tagNames ?? "").split(",").filter(Boolean),
      embeddingPointId: row.embeddingPointId ? String(row.embeddingPointId) : null,
      recStrategies: new Set(["collaborative"]),
      collaborativeScore: Number(row.cfScore) / maxCf,
    }));
  }

  /** 并行多路召回 + 去重合并 */
  async multiRecall(ctx: RecallContext): Promise<AttractionCandidate[]> {
    const [tag, semantic, behavior, collaborative] = await Promise.all([
      this.tagRecall(ctx),
      this.semanticRecall(ctx),
      this.behaviorRecall(ctx),
      this.collaborativeRecall(ctx),
    ]);

    const merged = new Map<number, AttractionCandidate>();

    for (const list of [tag, semantic, behavior, collaborative]) {
      for (const item of list) {
        const existing = merged.get(item.attractionId);
        if (!existing) {
          merged.set(item.attractionId, item);
          continue;
        }
        item.recStrategies.forEach((s) => existing.recStrategies.add(s));
        existing.semanticScore = Math.max(existing.semanticScore ?? 0, item.semanticScore ?? 0);
        existing.collaborativeScore = Math.max(
          existing.collaborativeScore ?? 0,
          item.collaborativeScore ?? 0,
        );
      }
    }

    return [...merged.values()];
  }
}
