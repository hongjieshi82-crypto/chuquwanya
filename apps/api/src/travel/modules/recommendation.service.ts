import type { Pool } from "mysql2/promise";

import { llmService } from "../ai/llm.service.js";
import { buildRecommendReasonPrompt } from "../ai/prompts/index.js";
import { TtlCache } from "../utils/cache.js";
import { config } from "../../config.js";
import { RecallService, type RecallContext } from "./recall.service.js";
import { RankingService, type RankedAttraction } from "./ranking.service.js";

export interface RecommendRequest extends RecallContext {
  days?: number;
  page?: number;
  pageSize?: number;
  skipLlm?: boolean;
}

export interface RecommendItem {
  attractionId: number;
  name: string;
  coverImageUri: string | null;
  score: number;
  matchTags: string[];
  aiReason: string;
  recStrategy: string[];
  rating: number;
  priceRange: string;
}

const recommendCache = new TtlCache<RecommendItem[]>(config.ai.recommendCacheTtl);

export class RecommendationService {
  private recall: RecallService;
  private ranking = new RankingService();

  constructor(private pool: Pool) {
    this.recall = new RecallService(pool);
  }

  async recommend(input: RecommendRequest): Promise<{
    recommendations: RecommendItem[];
    total: number;
    page: number;
  }> {
    const cacheKey = TtlCache.hashKey({ userId: input.userId, ...input, skipLlm: true });
    const cached = recommendCache.get(cacheKey);
    if (cached && !input.skipLlm) {
      return {
        recommendations: cached,
        total: cached.length,
        page: input.page ?? 1,
      };
    }

    const candidates = await this.recall.multiRecall(input);
    let rough = this.ranking.roughRank(candidates, input, 50);

    if (rough.length === 0) {
      rough = await this.popularityFallback(input, 50);
    }

    const fine = this.ranking.fineRank(rough, input, 15);
    const fineWithCovers = await this.attachCoverImages(fine);

    const withReasons =
      input.skipLlm || !llmService.isAvailable()
        ? fineWithCovers.map((item) => this.toRecommendItem(item, item.matchReasons.join("，") || "根据你的偏好精选"))
        : await this.attachAiReasons(fineWithCovers, input);

    recommendCache.set(cacheKey, withReasons);

    await this.logRecommendations(input.userId, input, withReasons);

    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 15;
    const start = (page - 1) * pageSize;

    return {
      recommendations: withReasons.slice(start, start + pageSize),
      total: withReasons.length,
      page,
    };
  }

  private async popularityFallback(input: RecommendRequest, limit: number): Promise<RankedAttraction[]> {
    const params: unknown[] = [];
    let filter = "";
    if (input.destination) {
      filter = "AND d.name LIKE ?";
      params.push(`%${input.destination}%`);
    }
    const [rows] = await this.pool.execute(
      `SELECT
         a.id AS attractionId, a.name, a.destination_id AS destinationId,
         a.rating, a.popularity, a.ticket_price_max AS ticketPriceMax,
         a.best_seasons AS bestSeasons, a.suitable_audiences AS suitableAudiences,
         a.embedding_point_id AS embeddingPointId,
         GROUP_CONCAT(t.name) AS tagNames
       FROM attractions a
       INNER JOIN destinations d ON d.id = a.destination_id
       LEFT JOIN attraction_tags at ON at.attraction_id = a.id
       LEFT JOIN travel_tags t ON t.id = at.tag_id
       WHERE a.is_active = TRUE ${filter}
       GROUP BY a.id
       ORDER BY a.popularity DESC, a.rating DESC
       LIMIT ?`,
      [...params, limit] as (string | number)[],
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
      roughScore: 0.5,
      finalScore: 0.5,
      matchTags: [],
      matchReasons: ["热门推荐"],
    }));
  }

  private toRecommendItem(item: RankedAttraction, aiReason: string): RecommendItem {
    return {
      attractionId: item.attractionId,
      name: item.name,
      coverImageUri: item.coverImageUri ?? null,
      score: Number(item.finalScore.toFixed(4)),
      matchTags: item.matchTags,
      aiReason,
      recStrategy: [...item.recStrategies],
      rating: item.rating,
      priceRange: `${Math.max(0, item.ticketPriceMax - 50)}-${item.ticketPriceMax}`,
    };
  }

  private async attachCoverImages(items: RankedAttraction[]): Promise<RankedAttraction[]> {
    if (items.length === 0) return items;

    const ids = [...new Set(items.map((item) => item.attractionId))];
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await this.pool.execute(
      `SELECT
         a.id AS attractionId,
         COALESCE(NULLIF(a.cover_image, ''), NULLIF(act.cover_image, '')) AS coverImageUri
       FROM attractions a
       LEFT JOIN activities act ON act.id = a.activity_id
       WHERE a.id IN (${placeholders})`,
      ids,
    );

    const coverMap = new Map(
      (rows as Array<Record<string, unknown>>).map((row) => [
        Number(row.attractionId),
        typeof row.coverImageUri === "string" && row.coverImageUri.trim() !== ""
          ? row.coverImageUri.trim()
          : null,
      ]),
    );

    return items.map((item) => ({
      ...item,
      coverImageUri: coverMap.get(item.attractionId) ?? null,
    }));
  }

  private async attachAiReasons(
    items: RankedAttraction[],
    input: RecommendRequest,
  ): Promise<RecommendItem[]> {
    const results: RecommendItem[] = [];

    for (const item of items) {
      const prompt = buildRecommendReasonPrompt({
        userPreferences: input.preferences,
        tripType: input.tripType,
        budget: input.budget,
        days: input.days,
        attractionName: item.name,
        attractionTags: item.tags,
        rating: item.rating,
        matchReasons: item.matchReasons,
      });

      let aiReason = "根据你的偏好为你精选";
      try {
        aiReason = (
          await llmService.complete([
            { role: "system", content: "你是专业旅游顾问，回答简洁自然。" },
            { role: "user", content: prompt },
          ])
        ).trim();
      } catch {
        aiReason = item.matchReasons.join("，") || aiReason;
      }

      results.push(this.toRecommendItem(item, aiReason));
    }

    return results;
  }

  private async logRecommendations(
    userId: number | undefined,
    input: RecommendRequest,
    items: RecommendItem[],
  ) {
    if (items.length === 0) return;

    const values = items.map((item) => [
      userId ?? null,
      JSON.stringify(input),
      item.attractionId,
      item.score,
      JSON.stringify(item.recStrategy),
      JSON.stringify(item.matchTags),
      item.aiReason,
    ]);

    const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(",");
    await this.pool.execute(
      `INSERT INTO recommendation_logs
        (user_id, request_params, attraction_id, final_score, rec_strategies, match_tags, ai_reason)
       VALUES ${placeholders}`,
      values.flat(),
    );
  }
}
